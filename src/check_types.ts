import {
  major,
  minor,
  minVersion,
} from "https://deno.land/std@0.185.0/semver/mod.ts";
import { Unrefined_dependency } from "./types.ts";
import { non_nullable } from "./utils.ts";
import { Package } from "./parse_dependencies.ts";

const is_type_dependency = (
  dependency: string,
): dependency is `@types/${string}` => dependency.startsWith("@types/");

export const get_types_in_direct_dependencies = ({ dependencies }: Package) =>
  Object.keys(dependencies).filter(is_type_dependency);

export const types_matching_dependencies = (
  { dependencies, devDependencies }: Pick<
    Package,
    "dependencies" | "devDependencies"
  >,
) => {
  const combined_dependencies = [
    dependencies,
    devDependencies,
  ].flatMap((_) => Object.entries(_));

  return combined_dependencies
    .filter(([name]) => is_type_dependency(name))
    .map(([name_typed, version_typed]) => {
      const [name_untyped, version_untyped] = combined_dependencies
        .find(([name_untyped]) => "@types/" + name_untyped === name_typed) ??
        [];

      return name_untyped && version_untyped
        ? { name_typed, name_untyped, version_typed, version_untyped }
        : undefined;
    }).filter(non_nullable);
};

const PIN_OR_TILDE = /^(~|\d)/;

interface Options {
  known_issues?: Unrefined_dependency["known_issues"];
}

export const mismatches = (
  dependencies: ReturnType<typeof types_matching_dependencies>,
  { known_issues }: Options = {},
) =>
  dependencies.map(
    ({ name_untyped, name_typed, version_typed, version_untyped }) => {
      const known_issue = known_issues
        ?.[`${name_untyped}@${version_untyped}`]
        ?.[name_typed];

      if (known_issue) {
        const [from, to] = known_issue;
        if (from === version_typed && to === version_untyped) return undefined;
      }

      if (
        !version_untyped.match(PIN_OR_TILDE) ||
        !version_typed.match(PIN_OR_TILDE)
      ) {
        return [
          name_untyped,
          "Invalid notation. Only pinned and tilde (~) ranges allowed",
        ] as const;
      }

      const main_min = minVersion(version_untyped);
      const type_min = minVersion(version_typed);

      if (!main_min || !type_min) {
        return [name_untyped, "Invalid range or version types"] as const;
      }

      if (major(main_min) !== major(type_min)) {
        return [name_untyped, "Mismatching major versions"] as const;
      }
      if (minor(main_min) !== minor(type_min)) {
        return [name_untyped, "Mismatching minor versions"] as const;
      }

      return undefined;
    },
  ).filter(non_nullable);
