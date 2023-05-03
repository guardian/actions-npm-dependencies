import { Package } from "./parse_dependencies.ts";

export const find_duplicates = (
  { dependencies = {}, devDependencies = {} }: Package,
): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  const potential_duplicates = [
    dependencies,
    devDependencies,
  ].flatMap(Object.keys);

  for (const name of potential_duplicates) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }

  return [...duplicates];
};
