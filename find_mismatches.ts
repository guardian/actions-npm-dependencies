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
  verbose = true,
) =>
  dependencies.map(({ name, peers }) => {
    if (peers.length === 0) return 0;

    const { length: unsatisfied } = peers.filter((peer) => !peer.satisfied);

    if (unsatisfied === 0) {
      if (verbose) {
        console.info(
          `✅ All ${colour.file("peerDependencies")} satisfied for ${
            colour.dependency(name)
          }`,
        );
      }
      return 0;
    }

    console.error(
      `🚨 Not all ${colour.file("peerDependencies")} are satisfied for ${
        colour.dependency(name)
      }:`,
    );

    for (const { name, range, satisfied } of peers) {
      const dependency = [
        colour.dependency(name),
        colour.subdued("@"),
        colour.version(range.raw),
      ].join("");

      if (satisfied) {
        if (verbose) {
          console.info(`   - ✅ ${dependency}`);
        }
      } else {
        console.error(
          `   - 🚨 ${dependency}`,
        );
      }
    }
    return unsatisfied;
  }).reduce((acc, curr) => acc + curr);
