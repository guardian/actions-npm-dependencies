import { get } from "./cache.ts";
import { format } from "./colours.ts";
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

const { parseAsync: parse_peers } = object({
  versions: record(object({
    version: string(),
    dependencies: record(string()).optional(),
    peerDependencies: record(string()).optional(),
    peerDependenciesMeta: record(object({ optional: boolean() }))
      .optional(),
  })),
});

export const fetch_peer_dependencies = (
  dependencies: Dependency[],
  { verbose = false, cache = false } = {},
): Promise<RegistryDependency[]> =>
  Promise.all(
    dependencies.map((dependency) =>
      get(
        new URL(
          encodeURIComponent(dependency.name),
          "https://registry.npmjs.org/",
        ),
        cache,
      )
        .then((res) => res.json())
        .then(parse_peers)
        .then((registry) => {
          const [version, ...versions] = Object.values(registry.versions)
            .filter(({ version }) => satisfies(version, dependency.range));

          if (!version) {
            throw new Error(
              `Could not find ${dependency.name}@${dependency.range.range}`,
            );
          }

          if (verbose && Object.keys(version.dependencies ?? {}).length > 0) {
            console.warn(
              `🔍 ${
                format(dependency.name, dependency.range)
              } – futher deps not analysed`,
            );
          }

          const peers = version.peerDependencies
            ? Object.entries(version.peerDependencies).map((
              [name, range],
            ) => {
              const local_version = dependencies.find((dependency) =>
                dependency.name === name
              )?.range;

              const local_min_version = local_version
                ? minVersion(local_version)
                : null;
              const local_version_matches = local_min_version
                ? satisfies(local_min_version, range)
                : false;

              const is_optional = !!version.peerDependenciesMeta?.[name]
                ?.optional;

              const satisfied = local_version
                ? local_version_matches
                : is_optional;

              return ({
                name,
                range: new Range(range),
                satisfied,
              });
            })
            : [];

          return ({
            ...dependency,
            peers,
            versions: [version, ...versions].map(({ version }) =>
              new SemVer(version)
            ),
          });
        })
        .catch((error) => {
          console.error("🚨 Failed to parse package.json for", dependency.name);
          throw error;
        })
    ),
  );

Deno.bench("Fetch with cache", async () => {
  await fetch_peer_dependencies([
    {
      name: "@guardian/core-web-vitals",
      range: new Range("2.0.2"),
    },
  ], { cache: true });
});

Deno.bench("Fetch without cache", async () => {
  await fetch_peer_dependencies([
    {
      name: "@guardian/core-web-vitals",
      range: new Range("2.0.2"),
    },
  ], { cache: false });
});
