import { colour, format } from "./colours.ts";
import { RegistryDependency } from "./types.ts";

export const count_unsatisfied_peer_dependencies = (
  dependencies: RegistryDependency[],
) =>
  dependencies.map(({ peers }) =>
    peers.filter((peer) => !peer.satisfied).length
  )
    .reduce((acc, curr) => acc + curr);

export const format_dependencies = (
  dependencies: RegistryDependency[],
  verbose = true,
): void => {
  dependencies.map(({ name, range, dependencies, peers }) => {
    console.info(
      `├─ ${format(name, range)}`,
    );

    let count = dependencies.length;
    for (const dependency of dependencies) {
      const angle = peers.length === 0 && --count === 0 ? "╰" : "├";
      console.warn(
        `│  ${angle}─ ${colour.version("▲")} ${
          format(dependency.name, dependency.range)
        } – futher ${colour.file("dependencies")} not analysed`,
      );
    }

    count = peers.length;
    for (const { name, range, satisfied } of peers) {
      const angle = --count === 0 ? "╰" : "├";
      if (satisfied) {
        if (verbose) {
          console.info(
            `│  ${angle}─ ${colour.valid("○")} ${format(name, range)}`,
          );
        }
      } else {
        console.error(
          `│  ${angle}─ ${colour.invalid("✕")} ${format(name, range)}`,
        );
      }
    }
  });
};
