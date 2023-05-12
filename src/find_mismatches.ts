import { colour } from "./colours.ts";
import { Graph } from "./package_graph.ts";
import { satisfies } from "https://deno.land/std@0.185.0/semver/mod.ts";
import { Package } from "./parse_dependencies.ts";

export const get_unsatisfied_peer_dependencies = (
  { dependencies, devDependencies }: Pick<
    Package,
    "dependencies" | "devDependencies"
  >,
  package_graph: Graph,
) => {
  const all_dependencies = { ...dependencies, ...devDependencies };

  const unsatisfied: Array<
    { name: string; local: string; required: string; from: string }
  > = [];

  for (
    const { name: from, peerDependencies, peerDependenciesMeta }
      of package_graph
        .values()
  ) {
    for (const [name, required] of Object.entries(peerDependencies)) {
      const is_optional = !!peerDependenciesMeta[name]?.optional;
      const local = all_dependencies[name];

      if (!local) {
        if (!is_optional) {
          unsatisfied.push({ name, local: "(missing)", required, from });
        }
        continue;
      }

      const valid = satisfies(
        local,
        required.replaceAll(/ +/g, ""),
      );

      if (!valid) {
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
      Array<{ required: string; from: string; local: string }>
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
