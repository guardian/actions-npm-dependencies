import { colour, format } from "./colours.ts";
import { Graph } from "./graph.ts";
import { satisfies } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { KnownIssues, Package, package_parser } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { get_identifier, Issue, Issues } from "./utils.ts";

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
): Issues => {
  const all_dependencies = { ...dependencies, ...devDependencies };

  const unsatisfied: Issues = [];

  for (
    const { name: from, peerDependencies, peerDependenciesMeta }
      of package_graph
        .values()
  ) {
    for (const [name, version] of Object.entries(peerDependencies)) {
      const is_optional = !!peerDependenciesMeta[name]?.optional;
      const local = all_dependencies[name];

      if (!local) {
        if (!is_optional) {
          const severity = known_issues[name] ? "warn" : "error";
          unsatisfied.push({ severity, name, version, from });
        }
        continue;
      }

      const satisfied = satisfies(local, version);
      if (!satisfied) {
        const severity = known_issues[get_identifier({ name, version })]
          ? "warn"
          : "error";
        unsatisfied.push({
          severity,
          name,
          version,
          from,
          message: format(name, local),
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
        { severity: "error", name: "peer", version: "0.0.1", from: "one" },
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
        {
          severity: "error",
          name: "one",
          version: "~1.1.1",
          from: "mock",
          message: format("one", "1.2.3"),
        },
        {
          severity: "error",
          name: "two",
          version: "^1.2.2",
          from: "mock",
          message: format("two", "2.4.6"),
        },
        {
          severity: "error",
          name: "three",
          version: "^3.6.10",
          from: "mock",
          message: format("three", "3.6.9"),
        },
      ],
    );
  });
});

export const format_dependencies_issues = (
  unsatisfied: Issues,
): void => {
  const grouped = unsatisfied.reduce(
    (map, issue) => {
      const found = map.get(issue.name) ?? [];
      found.push(issue);
      map.set(issue.name, found);
      return map;
    },
    new Map<
      string,
      Issues
    >(),
  );

  for (const [name, requirement_pairs] of grouped.entries()) {
    console.info(`║`);
    console.info(
      `╠╤═ ${colour.dependency(name)} locally ${
        colour.version(requirement_pairs[0]?.version ?? "missing")
      }`,
    );

    let count = requirement_pairs.length;
    for (const { message, from } of requirement_pairs) {
      const angle = --count === 0 ? "╰" : "├";
      console.warn(
        `║${angle}─ ${colour.invalid("✕")} ${message} required from ${
          colour.dependency(from ?? "--")
        }`,
      );
    }
  }
};
