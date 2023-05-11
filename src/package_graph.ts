import { parse } from "https://deno.land/std@0.185.0/semver/mod.ts";
import z from "https://deno.land/x/zod@v3.21.4/index.ts";
import { get_registry_dependency } from "./fetch_peer_dependencies.ts";
import { package_parser } from "./parse_dependencies.ts";

export type Dependency = z.infer<typeof package_parser>;
export type Identifier = `${string}@${string}`;
export type Graph = Awaited<ReturnType<typeof fetch_all_dependencies>>;

const get_identifier = (
  { name, version }: Dependency,
): Identifier => `${name}@${version}`;

export const fetch_all_dependencies = async (
  dependency: Dependency,
  map = new Map<Identifier, Dependency>(),
) => {
  const id = get_identifier(dependency);

  map.set(id, dependency);

  const dependencies = [
    ...Object.entries(dependency.dependencies ?? {}),
    ...Object.entries(dependency.devDependencies ?? {}),
  ];

  await Promise.all(dependencies.map(async ([name, range]) => {
    const version = parse(range)?.toString();

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
  const dependency = await Deno.readTextFile(filename)
    .then(JSON.parse).then(package_parser.parse);

  const all = await fetch_all_dependencies(dependency);

  console.log(all);
}
