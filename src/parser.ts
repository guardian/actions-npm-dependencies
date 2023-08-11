import z from "https://deno.land/x/zod@v3.21.4/index.ts";

const dependency = z.record(z.string()).optional();

export type KnownIssues = z.infer<typeof issues_parser>["known_issues"];
export const issues_parser = z.object({
  known_issues: z.record(z.array(z.string())).optional(),
});

const lib = z.object({
  name: z.string(),
  version: z.string(),
  private: z.literal(false),
});

const app = z.object({
  name: z.string(),
  version: z.string().default("0.0.0"),
  private: z.literal(true),
});

const common = z.object({
  scripts: z.record(z.string()).optional(),
  dependencies: dependency,
  devDependencies: dependency,
  optionalDependencies: dependency,
  peerDependencies: dependency,
  peerDependenciesMeta: z.record(z.object({ optional: z.boolean() }))
    .optional(),
});

export type Package = z.infer<typeof package_parser>;
export const package_parser = z.discriminatedUnion("private", [
  lib.merge(common).passthrough(),
  app.merge(common).passthrough(),
]);

export const registry_package_parser = z.object({
  name: z.string(),
  version: z.string(),
  private: z.literal(false).default(false),
}).merge(common);
