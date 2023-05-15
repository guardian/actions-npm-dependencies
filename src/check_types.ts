import { difference } from "https://deno.land/std@0.185.0/semver/mod.ts";
import {
  get_all_dependencies,
  get_identifier,
  Issue,
  Issues,
  non_nullable,
} from "./utils.ts";
import { KnownIssues, Package } from "./parse_dependencies.ts";
import { format } from "./colours.ts";
import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";

const is_type_dependency = (
  dependency: string,
): dependency is `@types/${string}` => dependency.startsWith("@types/");

export const get_types_in_direct_dependencies = ({ dependencies }: Package) =>
  Object.keys(dependencies).filter(is_type_dependency);

const to_types_package = (name: string) =>
  "@types/" + name.replace(/^@([^\/]+)\//, "$1__");
Deno.test("to_types_package", async (test) => {
  await test.step("handles regular packages", () => {
    assertEquals(
      to_types_package("qs"),
      "@types/qs",
    );
  });
  // https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master#what-about-scoped-packages
  await test.step("handles scoped packages", () => {
    assertEquals(
      to_types_package("@testing-library/jest-dom"),
      "@types/testing-library__jest-dom",
    );
  });
});

const types_matching_dependencies = (
  package_info: Parameters<typeof get_all_dependencies>[0],
) => {
  const all_dependencies = get_all_dependencies(package_info);

  return all_dependencies
    .filter(([name]) => is_type_dependency(name))
    .map(([name_typed, version_typed]) => {
      const [name_untyped, version_untyped] = all_dependencies
        .find(([name_untyped]) =>
          name_typed === to_types_package(name_untyped)
        ) ??
        [];

      return name_untyped && version_untyped
        ? {
          typed: { name: name_typed, version: version_typed },
          untyped: { name: name_untyped, version: version_untyped },
        }
        : undefined;
    }).filter(non_nullable);
};
Deno.test("types_matching_dependencies", async (test) => {
  await test.step("will not complain on types without an associated package", () => {
    const mismatches = types_matching_dependencies({
      devDependencies: { "@types/node": "18.11.1" },
      dependencies: { "typescript": "4.9.5" },
      optionalDependencies: {},
    });
    assertEquals(mismatches, []);
  });

  await test.step("will find potential mismatches on types with an associated package", () => {
    const matched = types_matching_dependencies({
      devDependencies: { "@types/react": "16.1.99" },
      dependencies: { "react": "16.1.0" },
      optionalDependencies: {},
    });
    assertEquals(matched, [{
      untyped: { name: "react", version: "16.1.0" },
      typed: { name: "@types/react", version: "16.1.99" },
    }]);
  });
});

/**
 * Lists of types with community types (@types/*) which do not share
 * the same major and minor version, as per [the DefinitelyTyped contract](https://github.com/DefinitelyTyped/DefinitelyTyped#how-do-definitely-typed-package-versions-relate-to-versions-of-the-corresponding-library).
 */
export const mismatches = (
  package_info: Parameters<typeof get_all_dependencies>[0],
  known_issues: KnownIssues = {},
): Issues =>
  types_matching_dependencies(package_info).map(
    ({ typed, untyped }): Issue | undefined => {
      const untyped_id = get_identifier(untyped);
      const typed_id = get_identifier(typed);

      const is_known_issue = !!known_issues[untyped_id]?.includes(typed_id);

      if (is_known_issue) return undefined;

      const release_difference = difference(typed.version, untyped.version);
      if (release_difference === null) return undefined;
      if (release_difference !== "patch") {
        return {
          severity: "error",
          ...untyped,
          from: format(typed.name, typed.version),
          message: release_difference,
        };
      }
    },
  ).filter(non_nullable);
