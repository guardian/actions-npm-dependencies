import { colour } from "./colours.ts";
import { satisfies } from "./deps.ts";
import { Dependency } from "./types.ts";

export const find_mismatched_peer_dependencies = (
  dependencies: Dependency[],
) => {
  const peers = dependencies.flatMap(({ name, peers }) =>
    peers.map((peer) => ({ ...peer, required_by: name }))
  );

  const mismatched = peers.filter((peer_dependency) => {
    const local_version = dependencies.find(
      ({ name }) => name === peer_dependency.name,
    );
    if (!local_version) {
      return !peer_dependency.optional;
    }
    return !satisfies(local_version.version, peer_dependency.range);
  });

  if (mismatched.length === 0) {
    console.info(`✅ All ${colour.file("peerDependencies")} satisfied}`);
  } else {
    console.error(
      `🚨 The following ${colour.file("peerDependencies")} are unsatisfied:`,
    );

    for (const { name, range, required_by } of mismatched) {
      console.error(
        `   - ${
          [
            colour.dependency(name),
            colour.subdued("@"),
            colour.version(range.raw),
            " (from ",
            colour.dependency(required_by),
            " )",
          ].join("")
        }`,
      );
    }
  }

  return mismatched;
};
