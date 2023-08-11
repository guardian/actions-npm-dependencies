import { parse } from "https://deno.land/std@0.198.0/semver/mod.ts";
import {
  get_all_dependencies,
  get_identifier,
  Issue,
  Issues,
} from "./utils.ts";
import { colour, format } from "./colours.ts";
import { KnownIssues } from "./parser.ts";
import { fetchJSON } from "./json.ts";
import { npm } from "./parser.ts";
import { ZodError } from "https://deno.land/x/zod@v3.21.4/index.ts";

const isExactVersion = (version: string) => {
  try {
    parse(version);
    return true;
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
};

export const make_exact = async (
  dependencies?: Record<string, string>,
): Promise<Record<string, string> | undefined> => {
  if (!dependencies) return undefined;

  const exact = await Promise.all(
    Object.entries(dependencies).map(async (
      [name, specifier],
    ) => {
      if (isExactVersion(specifier)) return [name, specifier] as const;

      const url =
        `https://data.jsdelivr.com/v1/packages/npm/${name}/resolved?specifier=${specifier}`;

      try {
        const { version } = await fetchJSON(url, { parser: npm.parse });

        console.info(
          `Found exact version ${format(name, version)} matching ${
            colour.version(specifier)
          }`,
        );
        return [name, version] as const;
      } catch (error) {
        if (error instanceof ZodError) return [name, specifier] as const;
        throw error;
      }
    }),
  );

  return Object.fromEntries(exact);
};

/**
 * Given development and direct dependencies, identify which
 * ones are not “pinned” to an exact version, as per our recommendations.
 *
 * @see https://github.com/guardian/recommendations/blob/main/dependencies.md#javascript
 */
export const get_dependencies_expressed_as_ranges = (
  package_info: Parameters<typeof get_all_dependencies>[0],
): Issues =>
  get_all_dependencies(package_info).flatMap<Issue>(
    ([name, version]) => {
      if (isExactVersion(version)) return [];

      const formatted = format(name, version);

      if (
        // @TODO: handle PNPM workspaces
        version === "workspace:*" ||
        version.startsWith("https://github.com/")
      ) {
        console.warn(`╟─ Ignoring ${formatted}`);
        return { severity: "warn", name, version };
      }

      console.error(`╟─ Use a exact version (X.Y.Z) for ${formatted}`);

      return { severity: "error", name, version };
    },
  );
