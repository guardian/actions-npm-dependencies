import { parse } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { get_registry_dependency } from "./fetch_peer_dependencies.ts";
import { Package } from "./parse_dependencies.ts";

export type Identifier = `${string}@${string}`;
export type Graph = Awaited<ReturnType<typeof fetch_all_dependencies>>;

const get_identifier = (
  { name, version }: Package,
): Identifier => `${name}@${version}`;

export const fetch_all_dependencies = async (
  dependency: Package,
  {
    map = new Map<Identifier, Package>(),
    cache = true,
  } = {},
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
        cache,
      );

      return fetch_all_dependencies(dependency, { map, cache });
    }
  }));

  return map;
};
