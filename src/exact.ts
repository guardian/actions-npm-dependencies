import { parse } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { get_all_dependencies } from "./utils.ts";
import { colour, format } from "./colours.ts";
import { Package } from "./parse_dependencies.ts";

export const get_dependencies_expressed_as_ranges = (
  package_info: Pick<
    Package,
    "dependencies" | "devDependencies" | "known_issues"
  >,
) => {
  const dependencies_as_range: Record<string, string> = {};
  for (
    const [name, version] of get_all_dependencies(package_info)
  ) {
    if (package_info.known_issues[`${name}@${version}`]) {
      console.warn(`╟─ Ignoring ${colour.dependency(name)}`);
      continue;
    }

    const exact = parse(version)?.toString() === version;
    if (!exact) {
      dependencies_as_range[name] = version;
      const formatted = format(name, version);

      if (version.startsWith("~")) {
        console.error(`╟─ Do no use tilde (~) notation for ${formatted}`);
      } else if (version.startsWith("^")) {
        console.error(`╟─ Do no use caret (^) notation for ${formatted}`);
      } else {
        console.error(`╟─ Use a semantic version for ${formatted}`);
      }
    }
  }

  return dependencies_as_range;
};
