import { fetchJSON } from "./json.ts";
import { package_parser } from "./parser.ts";
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";

const queue = new PQueue({ concurrency: 24 });

/** Get package.json of dependencies a given package */
export const get_registry_dependency = async (
  name: string,
  version: string,
) => {
  const url = new URL(
    `/npm/${name}@${version}/package.json`,
    "https://cdn.jsdelivr.net/",
  );

  const registry_dependency = await queue.add(() =>
    fetchJSON(url, { parser: package_parser.parse })
  );

  // We do not want to consider further
  registry_dependency.dependencies = {};

  // We do not want to consider development dependencies
  registry_dependency.devDependencies = {};

  return registry_dependency;
};
