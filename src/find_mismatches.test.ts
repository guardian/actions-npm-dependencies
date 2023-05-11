import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { get_unsatisfied_peer_dependencies } from "./find_mismatches.ts";

const mock_dependency = {
  name: "mock",
  version: "0.0.0",
  private: false,
  dependencies: {},
  devDependencies: {},
  peerDependenciesMeta: {},
  known_issues: {},
};

Deno.test("Works when all dependencies are matched", () => {
  const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
    {
      dependencies: {
        "one": "1.2.3",
        "two": "2.4.6",
      },
      devDependencies: { "three": "3.6.9" },
    },
    new Map([
      ["peer@0.1.1", {
        ...mock_dependency,
        peerDependencies: { "one": "^1", two: "~2.4.4" },
      }],
    ]),
  );

  assertEquals(unsatisfied_peer_dependencies, []);
});

Deno.test("Fails on invalid range", () => {
  const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
    {
      dependencies: {
        "one": "1.2.3",
        "two": "2.4.6",
      },
      devDependencies: { "three": "3.6.9" },
    },
    new Map([
      ["peer@0.1.1", {
        ...mock_dependency,
        peerDependencies: {
          "one": "~1.1.1",
          "two": "^1.2.2",
          "three": "^3.6.10",
        },
      }],
    ]),
  );

  assertEquals(
    unsatisfied_peer_dependencies,
    [
      { name: "one", local: "1.2.3", required: "~1.1.1", from: "mock" },
      { name: "three", local: "3.6.9", required: "^3.6.10", from: "mock" },
      { name: "two", local: "2.4.6", required: "^1.2.2", from: "mock" },
    ],
  );
});
