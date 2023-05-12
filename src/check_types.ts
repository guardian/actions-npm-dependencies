import { difference } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { non_nullable } from "./utils.ts";
import { KnownIssues, Package } from "./parse_dependencies.ts";

const is_type_dependency = (
  dependency: string,
): dependency is `@types/${string}` => dependency.startsWith("@types/");

export const get_types_in_direct_dependencies = ({ dependencies }: Package) =>
  Object.keys(dependencies).filter(is_type_dependency);

export const to_types_package = (name: string) =>
  "@types/" + name.replace(/^@([^\/]+)\//, "$1__");

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
        .find(([name_untyped]) =>
          name_typed === to_types_package(name_untyped)
        ) ??
        [];

      return name_untyped && version_untyped
        ? { name_typed, name_untyped, version_typed, version_untyped }
        : undefined;
    }).filter(non_nullable);
};

interface Options {
  known_issues?: KnownIssues;
}

export const mismatches = (
  dependencies: ReturnType<typeof types_matching_dependencies>,
  { known_issues = {} }: Options = {},
) =>
  dependencies.map(
    ({ name_untyped, name_typed, version_typed, version_untyped }) => {
      const is_known_issue =
        !!known_issues[`${name_untyped}@${version_untyped}`]
          ?.includes(`${name_typed}@${version_typed}`);

      if (is_known_issue) return undefined;

      const release_difference = difference(version_typed, version_untyped);
      if (release_difference === null) return undefined;
      if (release_difference !== "patch") {
        return [
          name_untyped,
          release_difference,
        ] as const;
      }
    },
  ).filter(non_nullable);
