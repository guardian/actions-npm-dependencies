import { colour } from "./colours.ts";
import {
  minVersion,
  Range,
  satisfies,
  SemVer,
} from "https://deno.land/std@0.177.0/semver/mod.ts";
import {
  boolean,
  infer as inferred,
  object,
  record,
  string,
} from "https://esm.sh/zod@3.20.2";
import type {
  Dependency,
  Registry_dependency,
  Unrefined_dependency,
} from "./types.ts";

const dependency = record(string()).optional();

export const json_parser = object({
  name: string(),
  version: string(),
  private: boolean().optional(),
  dependencies: dependency,
  devDependencies: dependency,
  peerDependencies: dependency,
  peerDependenciesMeta: record(object({ optional: boolean() })).optional(),
});

interface Options {
  known_issues?: Unrefined_dependency["known_issues"];
  cache?: boolean;
}

type Parsed_JSON = inferred<typeof json_parser>;

const registry_dependencies_cache = new Map<
  string,
  Parsed_JSON
>();

export const get_registry_dependency = async (
  name: string,
  version: string,
  cache: boolean,
): Promise<Parsed_JSON> => {
  if (cache && registry_dependencies_cache.size === 0) {
    const cached = JSON.parse(
      localStorage.getItem("registry_dependencies_cache") ?? "[]",
    );
    for (const [key, value] of cached) {
      registry_dependencies_cache.set(key, value);
    }
  }

  const url = new URL(
    `${name}@${version}/package.json`,
    "https://unpkg.com/",
  );

  const found = registry_dependencies_cache.get(url.href);
  if (cache && found) return found;

  const registry_dependency = await fetch(url)
    .then((res) => res.json())
    .then((json) => json_parser.parse(json));

  // We do not want to consider development dependencies
  delete registry_dependency.devDependencies;

  registry_dependencies_cache.set(url.href, registry_dependency);

  if (cache) {
    localStorage.setItem(
      "registry_dependencies_cache",
      JSON.stringify([...registry_dependencies_cache.entries()]),
    );
  }

  return registry_dependency;
};

export const fetch_peer_dependencies = (
  dependencies: Dependency[],
  { known_issues, cache }: Options = {},
): Promise<Registry_dependency[]> =>
  Promise.all(
    dependencies.map((dependency) =>
      get_registry_dependency(
        dependency.name,
        // @ts-expect-error -- we’ll fix it later
        minVersion(dependency.range),
        !!cache,
      )
        .then((registry) => {
          const peers = Object.entries(registry.peerDependencies ?? {}).map(
            ([name, range]) => {
              const local_version = dependencies.find(
                (dependency) => dependency.name === name,
              )?.range;

              const known_issue = known_issues
                ?.[`${dependency.name}@${dependency.range.raw}`]
                ?.[name];

              const comparative_range = known_issue
                ? range.replace(...known_issue)
                : range;

              const local_min_version = local_version
                ? minVersion(local_version)
                : null;
              const local_version_matches = local_min_version
                ? satisfies(local_min_version, comparative_range)
                : false;

              const is_optional = !!registry.peerDependenciesMeta?.[name]
                ?.optional;

              const satisfied = local_version
                ? local_version_matches
                : is_optional;

              return {
                name,
                range: new Range(range),
                satisfied,
                local: local_version,
              };
            },
          );

          return {
            ...dependency,
            dependencies: Object.entries(registry.dependencies ?? {}).filter(
              ([name, range]) => {
                try {
                  new Range(range);
                  return true;
                } catch (error) {
                  const reason = error instanceof Error
                    ? error.message
                    : "unknown";
                  console.warn(
                    `╟─ ${colour.version("△")} ${
                      colour.dependency(name)
                    } (${reason})`,
                  );
                }
                return false;
              },
            ).map(
              ([name, range]) => ({ name, range: new Range(range) }),
            ),
            peers,
            version: new SemVer(registry.version),
          };
        })
        .catch((error) => {
          console.error("🚨 Failed to parse package.json for", dependency.name);
          throw error;
        })
    ),
  );
