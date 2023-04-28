import {
  find_duplicates,
  parse_declared_dependencies,
  parse_package_info,
} from "./parse_dependencies.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";
import { colour, format } from "./colours.ts";
import {
  count_unsatisfied_peer_dependencies,
  format_dependencies,
} from "./find_mismatches.ts";
import { filter_types, matched_types, mismatches } from "./check_types.ts";

interface Options {
  verbose: boolean;
  cache: boolean;
}

export const package_health = async (
  package_content: unknown,
  { verbose, cache }: Options,
): Promise<number> => {
  const { name, range, dependencies, devDependencies, known_issues } =
    parse_package_info(
      package_content,
    );

  console.info(
    `╔═${"═".repeat(name.length)}╪${"═".repeat(range.range.length)}═╗`,
  );
  console.info(`╫ ${format(name, range)} ╫`);
  console.info(
    `╠═${"═".repeat(name.length)}╪${"═".repeat(range.range.length)}═╝`,
  );

  const types_in_direct_dependencies = filter_types(Object.keys(dependencies));

  if (types_in_direct_dependencies.length > 0) {
    console.error(
      `╟─ ${colour.version("△")} ${
        colour.dependency("@types/*")
      } should only be present in devDependencies`,
    );
  }

  const dependencies_from_package = parse_declared_dependencies(
    [
      dependencies,
      devDependencies,
    ].flatMap(Object.entries),
  );

  if (dependencies_from_package.length === 0) {
    if (verbose) {
      console.info("╰─ You have no dependencies and therefore no issues!");
    }
    return 0;
  }

  const duplicates = find_duplicates(dependencies_from_package);

  if (duplicates.length > 0) {
    console.error(`╠╤ Duplicate dependencies found!`);
    for (const name of duplicates) {
      console.error(`║╰─ ${colour.invalid("✕")} ${colour.dependency(name)}`);
    }
  }

  const definitely_typed_mismatches = mismatches(
    matched_types(dependencies_from_package),
    { known_issues },
  );

  if (definitely_typed_mismatches.length > 0) {
    console.error(
      `╠╤ Mismatched ${colour.dependency("@types/*")} dependencies found!`,
    );
    for (const [name, reason] of definitely_typed_mismatches) {
      console.error(
        `║├─ ${colour.invalid("✕")} ${
          colour.dependency("@types/" + name)
        }: ${reason}`,
      );
    }
  }

  const dependencies_from_registry = await fetch_peer_dependencies(
    dependencies_from_package,
    {
      known_issues,
      cache,
    },
  );

  format_dependencies(
    dependencies_from_registry,
    verbose,
  );

  const number_of_mismatched_deps = count_unsatisfied_peer_dependencies(
    dependencies_from_registry,
  );

  const problems = number_of_mismatched_deps +
    duplicates.length +
    definitely_typed_mismatches.length;

  console.info("║");
  console.info("╙───────────────────────────────────");

  if (problems === 0) {
    if (verbose) {
      console.info(`${colour.valid("○")} Dependencies are in good shape`);
    }
  } else if (problems === 1) {
    console.error(
      `${colour.invalid("✕")} There is ${
        colour.invalid("1")
      } dependencies problem`,
    );
  } else {
    console.error(
      `${colour.invalid("✕")} There are ${
        colour.invalid(String(problems))
      } dependencies problems`,
    );
  }

  if (Object.keys(known_issues).length > 0) {
    console.info("");
    console.info(
      `${colour.subdued("□")} There are ${
        Object.keys(known_issues).length
      } known issues:`,
    );
    for (const [name, issues] of Object.entries(known_issues)) {
      console.info(`${colour.dependency(name)}`);
      for (const [dependency, [from, to]] of Object.entries(issues)) {
        console.info(
          `${colour.subdued("□")} Substituted ${
            colour.dependency(dependency)
          }@${colour.version(to)}`,
          `(specified @${colour.version(from)})`,
        );
      }
    }
  }

  console.info("────────────────────────────────────");

  return problems;
};
