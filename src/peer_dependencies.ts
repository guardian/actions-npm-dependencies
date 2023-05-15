import { colour } from "./colours.ts";
import { Graph } from "./graph.ts";
import { satisfies } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { KnownIssues, Package, package_parser } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";

type Unsatisfied = {
  name: string;
  local?: string;
  required: string;
  from: string;
};

export const get_unsatisfied_peer_dependencies = (
  { dependencies, devDependencies }: Pick<
    Package,
    "dependencies" | "devDependencies"
  >,
  package_graph: Graph,
  { known_issues = {} }: { known_issues?: KnownIssues } = {},
) => {
  const all_dependencies = { ...dependencies, ...devDependencies };

  const unsatisfied: Unsatisfied[] = [];

  for (
    const { name: from, peerDependencies, peerDependenciesMeta }
      of package_graph
        .values()
  ) {
    for (const [name, required] of Object.entries(peerDependencies)) {
      const is_optional = !!peerDependenciesMeta[name]?.optional;
      const local = all_dependencies[name];

      if (known_issues[name]) continue;
      if (known_issues[`${name}@${required}`]) continue;

      if (!local) {
        if (!is_optional) {
          unsatisfied.push({ name, required, from });
        }
        continue;
      }

      const satisfied = satisfies(local, required);

      if (!satisfied) {
        unsatisfied.push({
          name,
          local,
          required,
          from,
        });
      }
    }
  }

  return unsatisfied;
};

Deno.test("get_unsatisfied_peer_dependencies", async (test) => {
  await test.step("works when all dependencies are matched", () => {
    const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
      {
        dependencies: {
          "one": "1.2.3",
          "two": "2.4.6",
        },
        devDependencies: { "three": "3.6.9" },
      },
      new Map([
        [
          "one@1.2.3",
          package_parser.parse({
            name: "one",
            version: "1.2.3",
            private: false,
            peerDependencies: { "one": "^1", two: "~2.4.4" },
          }),
        ],
      ]),
    );

    assertEquals(unsatisfied_peer_dependencies, []);
  });

  await test.step("handles optional dependencies gracefully", () => {
    const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
      {
        dependencies: { "one": "1.2.3" },
        devDependencies: {},
      },
      new Map([
        [
          "one@1.2.3",
          package_parser.parse({
            name: "one",
            version: "1.2.3",
            peerDependencies: {
              "two": "^2",
            },
            peerDependenciesMeta: {
              "two": { optional: true },
            },
          }),
        ],
      ]),
    );

    assertEquals(unsatisfied_peer_dependencies, []);
  });

  await test.step("fails on missing dependency", () => {
    const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
      {
        dependencies: {
          "one": "1.2.3",
        },
        devDependencies: {},
      },
      new Map([
        [
          "one@1.2.3",
          package_parser.parse({
            name: "one",
            version: "1.2.3",
            private: false,
            peerDependencies: {
              "peer": "0.0.1",
            },
          }),
        ],
      ]),
    );

    assertEquals(
      unsatisfied_peer_dependencies,
      [
        { name: "peer", required: "0.0.1", from: "one" },
      ],
    );
  });

  await test.step("fails on invalid range", () => {
    const unsatisfied_peer_dependencies = get_unsatisfied_peer_dependencies(
      {
        dependencies: {
          "one": "1.2.3",
          "two": "2.4.6",
        },
        devDependencies: { "three": "3.6.9" },
      },
      new Map([
        [
          "peer@0.1.1",
          package_parser.parse({
            name: "mock",
            version: "0.0.0",
            private: false,
            peerDependencies: {
              "one": "~1.1.1",
              "two": "^1.2.2",
              "three": "^3.6.10",
            },
          }),
        ],
      ]),
    );

    assertEquals(
      unsatisfied_peer_dependencies,
      [
        { name: "one", local: "1.2.3", required: "~1.1.1", from: "mock" },
        { name: "two", local: "2.4.6", required: "^1.2.2", from: "mock" },
        { name: "three", local: "3.6.9", required: "^3.6.10", from: "mock" },
      ],
    );
  });
});

export const format_dependencies = (
  unsatisfied: ReturnType<typeof get_unsatisfied_peer_dependencies>,
): void => {
  const grouped = unsatisfied.reduce(
    (map, { name, required, local, from }) => {
      const found = map.get(name) ?? [];
      found.push({ required, from, local });
      map.set(name, found);
      return map;
    },
    new Map<
      string,
      Omit<Unsatisfied, "name">[]
    >(),
  );

  for (const [name, requirement_pairs] of grouped.entries()) {
    console.info(`║`);
    console.info(
      `╠╤═ ${colour.dependency(name)} locally ${
        colour.version(requirement_pairs[0]?.local ?? "missing")
      }`,
    );

    let count = requirement_pairs.length;
    for (const { required, from } of requirement_pairs) {
      const angle = --count === 0 ? "╰" : "├";
      console.warn(
        `║${angle}─ ${colour.invalid("✕")} ${
          colour.version(required)
        } required from ${colour.dependency(from)}`,
      );
    }
  }
};
