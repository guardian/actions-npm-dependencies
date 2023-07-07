import { get_registry_dependency } from "./registry.ts";
import { type Package } from "./parser.ts";
import {
  get_all_dependencies,
  get_identifier,
  type Identifier,
} from "./utils.ts";
import { tryParse } from "https://deno.land/std@0.193.0/semver/try_parse.ts";
import { format } from "https://deno.land/std@0.193.0/semver/format.ts";

export type Graph = Awaited<ReturnType<typeof fetch_all_dependencies>>;

export const fetch_all_dependencies = async (
  dependency: Package,
  map = new Map<Identifier, Package>(),
) => {
  const id = get_identifier(dependency);

  map.set(id, dependency);

  const all_dependencies = get_all_dependencies(dependency);

  await Promise.all(all_dependencies.map(async ([name, range]) => {
    const version = tryParse(range);

    if (!version) return;

    if (!map.has(`${name}@${format(version)}`)) {
      const registry_dependency = await get_registry_dependency(name, version);

      await fetch_all_dependencies(registry_dependency, map);
    }
  }));

  return map;
};
