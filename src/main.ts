import { package_parser } from "./parse_dependencies.ts";
import { colour, format } from "./colours.ts";
import {
  format_dependencies,
  get_unsatisfied_peer_dependencies,
} from "./find_mismatches.ts";
import {
  get_types_in_direct_dependencies,
  mismatches,
  types_matching_dependencies,
} from "./check_types.ts";
import { fetch_all_dependencies } from "./package_graph.ts";
import { get_dependencies_expressed_as_ranges } from "./exact.ts";
import { find_duplicates } from "./duplicates.ts";

const triangle = colour.version("△");
const cross = colour.invalid("✕");
const square = colour.subdued("□");
const circle = colour.valid("○");

interface Options {
  verbose: boolean;
  cache: boolean;
}
export const package_health = async (
  package_content: unknown,
  { verbose, cache }: Options,
): Promise<number> => {
  const package_info = package_parser.parse(package_content);
  const { name, version, known_issues } = package_info;

  console.info(
    `╔═${"═".repeat(name.length)}╪${"═".repeat(version.length)}═╗`,
  );
  console.info(`╫ ${format(name, version)} ╫`);
  console.info(
    `╠═${"═".repeat(name.length)}╪${"═".repeat(version.length)}═╝`,
  );

  const type = package_info.private ? "app" : "lib";

  console.info(
    `╟─ ${square} Package identified as ${
      colour.dependency(type)
    } because private is ${colour.version(package_info.private.toString())}`,
  );
  console.info("║");

  const types_in_direct_dependencies = get_types_in_direct_dependencies(
    package_info,
  );

  if (types_in_direct_dependencies.length > 0) {
    console.error(
      `╟─ ${triangle} ${
        colour.dependency("@types/*")
      } should only be present in devDependencies`,
    );
  } else {
    console.info(
      `╟─ ${circle} All @types/* listed in devDependencies`,
    );
  }

  get_dependencies_expressed_as_ranges(package_info);

  const duplicates = find_duplicates(package_info);

  if (duplicates.length > 0) {
    console.error(`╠╤ Duplicate dependencies found!`);
    for (const name of duplicates) {
      console.error(`║╰─ ${cross} ${colour.dependency(name)}`);
    }
  }

  const definitely_typed_mismatches = mismatches(
    types_matching_dependencies(package_info),
    package_info,
  );

  if (definitely_typed_mismatches.length > 0) {
    console.error(
      `╠╤ Mismatched ${colour.dependency("@types/*")} dependencies found!`,
    );
    for (const [name, reason] of definitely_typed_mismatches) {
      console.error(
        `║├─ ${cross} ${colour.dependency("@types/" + name)}: ${reason}`,
      );
    }
  }

  const dependency_graph = await fetch_all_dependencies(package_info, {
    cache,
  });

  const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
    package_info,
    dependency_graph,
  );

  format_dependencies(unsatisfied_peer_dependencies);

  const problems = unsatisfied_peer_dependencies.length +
    duplicates.length +
    definitely_typed_mismatches.length;

  console.info("║");
  console.info("╙───────────────────────────────────");

  if (problems === 0) {
    if (verbose) {
      console.info(`${circle} Dependencies are in good shape`);
    }
  } else if (problems === 1) {
    console.error(
      `${cross} There is ${colour.invalid("1")} dependencies problem`,
    );
  } else {
    console.error(
      `${cross} There are ${
        colour.invalid(String(problems))
      } dependencies problems`,
    );
  }

  if (Object.keys(known_issues).length > 0) {
    console.info("");
    console.info(
      `${square} There are ${Object.keys(known_issues).length} known issues:`,
    );
    for (const [name, issues] of Object.entries(known_issues)) {
      console.info(`${colour.dependency(name)}`);
      for (const issue of issues) {
        console.info(
          `${square} Substituted ${issue}`,
        );
      }
    }
  }

  console.info("────────────────────────────────────");

  return problems;
};
