import { issues_parser, package_parser } from "./parser.ts";
import { colour, format } from "./colours.ts";
import {
  format_dependencies_issues,
  get_unsatisfied_peer_dependencies,
} from "./peer_dependencies.ts";
import { get_types_in_direct_dependencies, mismatches } from "./types.ts";
import { fetch_all_dependencies } from "./graph.ts";
import { get_dependencies_expressed_as_ranges } from "./exact.ts";
import { find_duplicates } from "./duplicates.ts";

const triangle = colour.version("△");
const cross = colour.invalid("✕");
const square = colour.subdued("□");
const circle = colour.valid("○");

interface Options {
  verbose: boolean;
}
export const package_health = async (
  package_content: unknown,
  { verbose }: Options,
): Promise<number> => {
  const package_info = package_parser.parse(package_content);
  const { name, version } = package_info;
  const { known_issues } = issues_parser.parse(package_content);

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

  const range_dependencies = get_dependencies_expressed_as_ranges(
    package_info,
    known_issues,
  );

  if (range_dependencies.some(({ severity }) => severity === "error")) {
    console.info([
      "║",
      "╠═ If you have inexact dependencies which do not specify a patch version–i.e. not matching X.Y.Z",
      "║  you can run the ./yarn.ts script to get the exact versions from your lockfile!",
      "║",
    ].join("\n"));
  }

  const duplicates = find_duplicates(package_info);

  if (duplicates.length > 0) {
    console.error(`╠╤ Duplicate dependencies found!`);
    for (const { name } of duplicates) {
      console.error(`║╰─ ${cross} ${colour.dependency(name)}`);
    }
  }

  const definitely_typed_mismatches = mismatches(
    package_info,
    known_issues,
  );

  if (definitely_typed_mismatches.length > 0) {
    console.error(
      `╠╤═ Mismatched ${colour.dependency("@types/*")} dependencies found!`,
    );
    let count = definitely_typed_mismatches.length;
    for (
      const { name, version, from, message } of definitely_typed_mismatches
    ) {
      const leg = --count > 0 ? "├" : "╰";
      console.error(
        `║${leg}─ ${cross} ${format(name, version)} differs by ${
          colour.invalid(message ?? "unknown")
        } from ${from}`,
      );
    }
  }

  const start = performance.now();

  const dependency_graph = await fetch_all_dependencies(package_info);

  console.info("║");
  console.info(
    `╟─ ${square} Fetched ${
      colour.version(String(dependency_graph.size))
    } dependencies in ${((performance.now() - start) / 1_000).toFixed(1)}s`,
  );

  const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
    package_info,
    dependency_graph,
    { known_issues },
  );

  format_dependencies_issues(unsatisfied_peer_dependencies);

  const problems = unsatisfied_peer_dependencies.length +
    duplicates.length +
    range_dependencies.length +
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

  const known_issues_array = Object.entries(known_issues);
  if (known_issues_array.length > 0) {
    console.info("");
    console.info(
      `${square} There are ${known_issues_array.length} known issues:`,
    );
    for (const [name, issues] of known_issues_array) {
      console.info(`╤ ${colour.dependency(name)}`);
      let count = issues.length;
      for (const issue of issues) {
        const leg = --count > 0 ? "├" : "╰";
        console.info(
          `${leg} ${square} Substituted ${issue}`,
        );
      }
    }
  }

  console.info("────────────────────────────────────");

  return problems;
};
