import {
  find_duplicates,
  package_parser,
  parse_declared_dependencies,
  parse_package_info,
} from "./parse_dependencies.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";
import { colour, format } from "./colours.ts";
import {
  count_unsatisfied_peer_dependencies,
  format_dependencies,
} from "./find_mismatches.ts";
import {
  get_types_in_direct_dependencies,
  mismatches,
  types_matching_dependencies,
} from "./check_types.ts";
import { parse } from "https://deno.land/std@0.185.0/flags/mod.ts";

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
  const { name, range, dependencies, devDependencies, known_issues } =
    parse_package_info(package_content);
  const package_info = package_parser.parse(package_content);

  console.info(
    `╔═${"═".repeat(name.length)}╪${"═".repeat(range.range.length)}═╗`,
  );
  console.info(`╫ ${format(name, range)} ╫`);
  console.info(
    `╠═${"═".repeat(name.length)}╪${"═".repeat(range.range.length)}═╝`,
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
      console.error(`║╰─ ${cross} ${colour.dependency(name)}`);
    }
  }

  const definitely_typed_mismatches = mismatches(
    types_matching_dependencies(package_info),
    { known_issues },
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
      for (const [dependency, [from, to]] of Object.entries(issues)) {
        console.info(
          `${square} Substituted ${colour.dependency(dependency)}@${
            colour.version(to)
          }`,
          `(specified @${colour.version(from)})`,
        );
      }
    }
  }

  console.info("────────────────────────────────────");

  return problems;
};

if (import.meta.main) {
  const { _: [package_file], verbose, cache, errors: expected_errors } = parse(
    Deno.args,
    {
      boolean: ["verbose", "cache"],
      negatable: ["cache"],
      default: { errors: 0 },
    },
  );

  if (typeof package_file !== "string") {
    console.error("🚨 No package.json passed as argument");
    Deno.exit(1);
  }

  const filename = Deno.cwd() + "/" + package_file;

  const package_content: unknown = await Deno.readTextFile(filename)
    .catch(() => "").then(JSON.parse);

  if (!package_content) {
    console.error("🚨 No package.json found at", colour.file(filename));
    Deno.exit(1);
  }

  const errors = await package_health(package_content, { verbose, cache });

  if (typeof expected_errors !== "number" || errors != expected_errors) {
    Deno.exit(errors);
  } else {
    console.info(
      "(Expected exactly",
      expected_errors,
      "errors – exiting gracefully)",
    );
    Deno.exit();
  }
}
