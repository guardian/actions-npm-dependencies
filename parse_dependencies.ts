import { object, Range, record, string } from "./deps.ts";
import { colour } from "./colours.ts";
import { Dependency } from "./types.ts";

const { parse } = object({
  dependencies: record(string()).optional(),
  devDependencies: record(string()).optional(),
});

const parse_dependencies = (o: Record<string, string>): Dependency[] =>
  Object.entries(o).map(([name, version]) => {
    const range = new Range(version);
    if (!range) throw new Error(`Could not parse semver: ${version}`);
    return {
      name,
      range,
    };
  });

const find_duplicates = (deps: Dependency[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const { name } of deps) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }

  return [...duplicates];
};

export const parse_declared_dependencies = (contents: string): Dependency[] => {
  const { dependencies = {}, devDependencies = {} } = parse(
    JSON.parse(contents),
  );

  const deps = [dependencies, devDependencies].map(parse_dependencies).flat();

  const duplicates = find_duplicates(deps);

  if (duplicates.length > 0) {
    console.warn("🚨 Duplicate dependencies found:");
    for (const duplicate of duplicates) {
      console.warn(`   - ${colour.dependency(duplicate)}`);
    }

    throw new Error("Duplicates found");
  }

  return deps;
};
