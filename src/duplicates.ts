import { Package } from "./parse_dependencies.ts";
import { get_all_dependencies } from "./utils.ts";

export const find_duplicates = (
  package_info: Pick<Package, "dependencies" | "devDependencies">,
): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const [name] of get_all_dependencies(package_info)) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }

  return [...duplicates];
};
