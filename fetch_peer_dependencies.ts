import { literal, object, Range, record, string } from "./deps.ts";
import { Dependency, PeerDependency } from "./types.ts";

const { parseAsync: parse_peers } = object({
  peerDependencies: record(string()).optional(),
  peerDependenciesMeta: record(object({ optional: literal(true) })).optional(),
});

export const fetch_peer_dependencies = (
  dependencies: Dependency[],
): Promise<Dependency[]> =>
  Promise.all(
    dependencies.map((dependency) =>
      fetch(
        new URL(
          `${dependency.name}@${dependency.version.version}/package.json`,
          "https://esm.sh/",
        ),
      )
        .then((res) => res.json())
        .then(parse_peers)
        .then(({ peerDependencies = {}, peerDependenciesMeta }) => ({
          ...dependency,
          peers: Object.entries(peerDependencies).map(([name, range]) => ({
            name,
            range: new Range(range),
            optional: !!peerDependenciesMeta?.[name]?.optional,
          })),
        }))
        .catch((error) => {
          console.error("🚨 Failed to parse package.json for", dependency.name);
          throw error;
        })
    ),
  );
