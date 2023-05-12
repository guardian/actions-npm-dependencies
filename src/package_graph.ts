import { parse } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { get_registry_dependency } from "./fetch_peer_dependencies.ts";
import { Package } from "./parse_dependencies.ts";
import { get_all_dependencies } from "./utils.ts";

export type Identifier = `${string}@${string}`;
export type Graph = Awaited<ReturnType<typeof fetch_all_dependencies>>;

const get_identifier = (
  { name, version }: Package,
): Identifier => `${name}@${version}`;

export const fetch_all_dependencies = async (
  dependency: Package,
  map = new Map<Identifier, Package>(),
) => {
  const id = get_identifier(dependency);

  map.set(id, dependency);

  const all_dependencies = get_all_dependencies(dependency);

  await Promise.all(all_dependencies.map(async ([name, range]) => {
    const version = parse(range)?.toString();

    if (!map.has(`${name}@${version}`) && version) {
      const registry_dependency = await get_registry_dependency(name, version);

      await fetch_all_dependencies(registry_dependency, map);
    }
  }));

  return map;
};
