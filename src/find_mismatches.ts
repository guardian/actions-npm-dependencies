import { colour } from "./colours.ts";
import { Graph } from "./package_graph.ts";
import { satisfies } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { KnownIssues, Package } from "./parse_dependencies.ts";

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
