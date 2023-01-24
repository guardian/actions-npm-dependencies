import { colour, format } from "./colours.ts";
import { RegistryDependency } from "./types.ts";

export const count_unsatisfied_peer_dependencies = (
  dependencies: RegistryDependency[],
  verbose = true,
) =>
  dependencies.map(({ name, range, peers }) => {
    if (peers.length === 0) return 0;

    const { length: unsatisfied } = peers.filter((peer) => !peer.satisfied);

    if (unsatisfied === 0) {
      if (verbose) {
        console.info(
          `✅ ${format(name, range)} – all ${
            colour.file("peerDependencies")
          } satisfied`,
        );
      }
      return 0;
    }

    console.error(
      `🚨 ${format(name, range)} – unsatisfied ${
        colour.file("peerDependencies")
      }`,
    );

    for (const { name, range, satisfied } of peers) {
      if (satisfied) {
        if (verbose) {
          console.info(`   - ✅ ${format(name, range)}`);
        }
      } else {
        console.error(
          `   - 🚨 ${format(name, range)}`,
        );
      }
    }
    return unsatisfied;
  }).reduce((acc, curr) => acc + curr);
