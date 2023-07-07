import { parse } from "https://deno.land/std@0.185.0/semver/mod.ts";
import {
  get_all_dependencies,
  get_identifier,
  Issue,
  Issues,
  non_nullable,
} from "./utils.ts";
import { colour, format } from "./colours.ts";
import { KnownIssues } from "./parser.ts";

/**
 * Given development and direct dependencies, identify which
 * ones are not “pinned” to an exact version, as per our recommendations.
 *
 * @see https://github.com/guardian/recommendations/blob/main/dependencies.md#javascript
 */
export const get_dependencies_expressed_as_ranges = (
  package_info: Parameters<typeof get_all_dependencies>[0],
  known_issues: KnownIssues,
): Issues =>
  get_all_dependencies(package_info).map(
    ([name, version]): Issue | undefined => {
      const exact = parse(version)?.toString() === version;
      if (!exact) {
        // @TODO: handle PNPM workspaces
        if (version === "workspace:*") {
          console.warn(`╟─ Ignoring ${format(name, version)}`);
          return { severity: "warn", name, version };
        }

        if (known_issues[get_identifier({ name, version })]) {
          console.warn(`╟─ Ignoring ${colour.dependency(name)}`);
          return { severity: "warn", name, version };
        }

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
          console.error(`╟─ Use a exact version (X.Y.Z) for ${formatted}`);
        }

        return { severity: "error", name, version };
      }
    },
  ).filter(non_nullable);
