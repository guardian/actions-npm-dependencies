import { object, Range, record, string, tuple } from "./deps.ts";
import { colour } from "./colours.ts";
import { Dependency, Unrefined_dependency } from "./types.ts";
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
  known_issues: record(record(tuple([string(), string()]))).optional(),
});

export const parse_package_info = (contents: unknown): Unrefined_dependency => {
  const {
    name,
    version,
    dependencies = {},
    devDependencies = {},
    known_issues = {},
  } = package_parser.parse(
    contents,
  );
  return {
    name,
    range: new Range(version),
    dependencies,
    devDependencies,
    known_issues,
  };
};

export const parse_declared_dependencies = (
  dependencies: [name: string, range: string][],
): Dependency[] =>
  dependencies.map(([name, range]) => {
    try {
      return { name, range: new Range(range) };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "unknown";
      console.warn(
        `╟─ ${colour.version("△")}`,
        colour.dependency(name),
        `(${reason})`,
      );
    }
    return undefined;
  }).filter(isDefined).flat();
