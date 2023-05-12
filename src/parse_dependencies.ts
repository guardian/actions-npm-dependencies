import z from "https://deno.land/x/zod@v3.21.4/index.ts";

const dependency = z.record(z.string());

export type KnownIssues = z.infer<typeof issues_parser>["known_issues"];
export const issues_parser = z.object({
  known_issues: z.record(z.array(z.string())).default({}),
});

export type Package = z.infer<typeof package_parser>;
export const package_parser = z.object({
  name: z.string(),
  version: z.string(),
  private: z.boolean().default(false),
  dependencies: dependency.default({}),
  devDependencies: dependency.default({}),
  peerDependencies: dependency.default({}),
  peerDependenciesMeta: z.record(z.object({ optional: z.boolean() }))
    .default({}),
});
