import { parse } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { get_all_dependencies, get_identifier } from "./utils.ts";
import { colour, format } from "./colours.ts";
import { KnownIssues, Package } from "./parse_dependencies.ts";

export const get_dependencies_expressed_as_ranges = (
  package_info: Pick<
    Package,
    "dependencies" | "devDependencies"
  >,
  known_issues: KnownIssues,
) => {
  const dependencies_as_range: Record<string, string> = {};
  for (
    const [name, version] of get_all_dependencies(package_info)
  ) {
    const exact = parse(version)?.toString() === version;
    if (!exact) {
      if (version === "workspace:*") {
        console.warn(`╟─ Ignoring ${format(name, version)}`);
        continue;
      }

      if (known_issues[get_identifier({ name, version })]) {
        console.warn(`╟─ Ignoring ${colour.dependency(name)}`);
        continue;
      }

      dependencies_as_range[name] = version;
      const formatted = format(name, version);

      if (version.startsWith("~")) {
        console.error(
          `╟─ ${
            colour.invalid("Do not")
          } use tilde (~) notation for ${formatted}`,
        );
      } else if (version.startsWith("^")) {
        console.error(
          `╟─ ${
            colour.invalid("Do not")
          } use caret (^) notation for ${formatted}`,
        );
      } else {
        console.error(`╟─ Use a semantic version for ${formatted}`);
      }
    }
  }

  return dependencies_as_range;
};
