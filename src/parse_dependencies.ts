import { object, Range, record, string } from "./deps.ts";
import { colour } from "./colours.ts";
import { Dependency, UnrefinedDependency } from "./types.ts";
import { isDefined } from "./utils.ts";

export const find_duplicates = (dependencies: Dependency[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const { name } of dependencies) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }

  return [...duplicates];
};

const package_parser = object({
  name: string(),
  version: string(),
  dependencies: record(string()).optional(),
  devDependencies: record(string()).optional(),
});

export const parse_package_info = (contents: unknown): UnrefinedDependency => {
  const { name, version, dependencies = {}, devDependencies = {} } =
    package_parser.parse(
      contents,
    );
  return { name, range: new Range(version), dependencies, devDependencies };
};

export const parse_declared_dependencies = (
  dependencies: [name: string, range: string][],
): Dependency[] =>
  dependencies.map(([name, range]) => {
    try {
      return { name, range: new Range(range) };
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.message);
      console.warn(
        "🚨 Ignored peer dependency",
        colour.dependency(name),
        colour.subdued("@"),
        colour.version(range),
      );
    }
    return undefined;
  }).filter(isDefined).flat();
