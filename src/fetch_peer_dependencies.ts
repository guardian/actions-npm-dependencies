import { get } from "./cache.ts";
import {
  boolean,
  minVersion,
  object,
  Range,
  record,
  satisfies,
  SemVer,
  string,
} from "./deps.ts";
import type { Dependency, RegistryDependency } from "./types.ts";

const { parse } = object({
  version: string(),
  dependencies: record(string()).optional(),
  peerDependencies: record(string()).optional(),
  peerDependenciesMeta: record(object({ optional: boolean() })).optional(),
});

export const fetch_peer_dependencies = (
  dependencies: Dependency[],
  cache?: Cache,
): Promise<RegistryDependency[]> =>
  Promise.all(
    dependencies.map((dependency) =>
      get(
        new URL(
          `${dependency.name}@${minVersion(dependency.range)}/package.json`,
          "https://unpkg.com/",
        ),
        cache,
      )
        .then((res) => res.json() as unknown)
        .then((json) => parse(json))
        .then((registry) => {
          const peers = Object.entries(registry.peerDependencies ?? {}).map(
            ([name, range]) => {
              const local_version = dependencies.find(
                (dependency) => dependency.name === name,
              )?.range;

              const local_min_version = local_version
                ? minVersion(local_version)
                : null;
              const local_version_matches = local_min_version
                ? satisfies(local_min_version, range)
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
                } catch {
                  console.warn("Invalid range:", `${name}@${range}`);
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
