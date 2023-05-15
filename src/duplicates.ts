import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { get_all_dependencies, Issues } from "./utils.ts";

/**
 * Find dependencies that are listed in two or more
 * of the following objects, as it has an ambiguous meaning:
 * - [dependencies](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#dependencies)
 * - [devDependencies](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#devdependencies)
 * - [optionalDependencies](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#optionaldependencies)
 */
export const find_duplicates = (
  package_info: Parameters<typeof get_all_dependencies>[0],
): Issues => {
  const seen = new Set<string>();
  const duplicates = new Map<string, string>();

  for (const [name, version] of get_all_dependencies(package_info)) {
    if (seen.has(name)) duplicates.set(name, version);
    seen.add(name);
  }

  return [...duplicates.entries()]
    .map(([name, version]) => ({ severity: "error", name, version }));
};

Deno.test("find_duplicates", async (test) => {
  await test.step("Warns on duplicate dependencies", () => {
    const package_info: Parameters<typeof get_all_dependencies>[0] = {
      dependencies: {
        "one": "1.0.0",
        "two": "2.0.0",
      },
      devDependencies: {
        "two": "2.2.2",
      },
      optionalDependencies: {},
    };
    const duplicates = find_duplicates(package_info);

    assertEquals(duplicates, [{
      severity: "error",
      name: "two",
      version: "2.2.2",
    }]);
  });
});
