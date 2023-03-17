import { minVersion, Range } from "https://deno.land/std@0.177.0/semver/mod.ts";
import {
  get_registry_dependency,
  json_parser,
} from "./fetch_peer_dependencies.ts";

import { infer as inferred } from "https://esm.sh/zod@3.20.2";

type Dependency = inferred<typeof json_parser>;
type Identifier = `${string}@${string}`;

const get_identifier = (
  { name, version }: Dependency,
): Identifier => `${name}@${version}`;

const fetch_all_dependencies = async (
  dependency: Dependency,
  map = new Map<Identifier, Dependency>(),
) => {
  const id = get_identifier(dependency);

  //   console.log({ id, dependency });
  map.set(id, dependency);

  const dependencies = [
    ...Object.entries(dependency.dependencies ?? {}),
    ...Object.entries(dependency.devDependencies ?? {}),
  ];

  await Promise.all(dependencies.map(async ([name, range]) => {
    const version = minVersion(range)?.toString();

    if (!map.has(`${name}@${version}`) && version) {
      const dependency = await get_registry_dependency(
        name,
        version,
        true,
      );

      return fetch_all_dependencies(dependency, map);
    }
  }));

  return map;
};

if (import.meta.main) {
  const filename = new URL(import.meta.resolve("../fixtures/package.json"));
  const package_content: unknown = await Deno.readTextFile(filename)
    .catch(() => "")
    .then(JSON.parse);

  const dependency = json_parser.parse(package_content);
  const all = await fetch_all_dependencies(dependency);

  console.log(all);
}
