import { colour } from "./colours.ts";
import { Dependency, RegistryDependency } from "./types.ts";

interface Matching {
  name: string;
  peers?: never;
}

interface Missing {
  name: string;
  peers: Dependency[];
}

export const count_unsatisfied_peer_dependencies = (
  dependencies: RegistryDependency[],
) =>
  dependencies.map(({ name, peers }) => {
    const { length: unsatisfied } = peers.filter((peer) => !peer.satisfied);

    if (unsatisfied === 0) {
      console.info(
        `✅ All ${colour.file("peerDependencies")} satisfied for ${
          colour.dependency(name)
        }`,
      );
    } else {
      console.error(
        `🚨 Not all ${colour.file("peerDependencies")} are satisfied for ${
          colour.dependency(name)
        }:`,
      );
    }

    for (const { name, range, satisfied } of peers) {
      console.error(
        `   - ${satisfied ? "✅" : "🚨"} ${
          [
            colour.dependency(name),
            colour.subdued("@"),
            colour.version(range.raw),
          ].join("")
        }`,
      );
    }

    return unsatisfied;
  }).reduce((acc, curr) => acc + curr);
