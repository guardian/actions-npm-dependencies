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
  const duplicates = new Set<string>();

  for (const [name] of get_all_dependencies(package_info)) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }

  return [...duplicates].map((name) => ({ severity: "error", name }));
};
