import z from "https://deno.land/x/zod@v3.21.4/index.ts";
import { get_all_dependencies } from "./utils.ts";

const dependency = z.record(z.string());

const known_issues = z.record(z.array(z.string())).default({});

export const package_parser = z.object({
  name: z.string(),
  version: z.string(),
  private: z.boolean().default(false),
  dependencies: dependency.default({}),
  devDependencies: dependency.default({}),
  peerDependencies: dependency.default({}),
  peerDependenciesMeta: z.record(z.object({ optional: z.boolean() }))
    .default({}),
  known_issues,
});

export type Package = z.infer<typeof package_parser>;
