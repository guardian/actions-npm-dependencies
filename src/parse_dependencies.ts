import z from "https://deno.land/x/zod@v3.21.4/index.ts";
import { Range } from "https://deno.land/std@0.185.0/semver/mod.ts";
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

const dependency = z.record(z.string());

const package_parser = z.object({
  name: z.string(),
  version: z.string(),
  private: z.boolean(),
  dependencies: dependency.optional(),
  devDependencies: dependency.optional(),
  peerDependencies: dependency.optional(),
  known_issues: z.record(z.record(
    z.tuple([z.string(), z.string()]),
  )).optional(),
});

export const parse_package_info = (contents: unknown): Unrefined_dependency => {
  const {
    name,
    version,
    private: _private,
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
    known_issues = {},
  } = package_parser.parse(
    contents,
  );
  return {
    name,
    range: new Range(version),
    type: _private ? "app" : "lib",
    dependencies,
    devDependencies,
    peerDependencies,
    known_issues,
  };
};

export const parse_declared_dependencies = (
  dependencies: [name: string, range: string][],
): Dependency[] =>
  dependencies.map(([name, range]) => {
    try {
      return { name, range: new Range(range), type: "lib" } as const;
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
