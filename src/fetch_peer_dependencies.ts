import { package_parser } from "./parse_dependencies.ts";
import { Package } from "./parse_dependencies.ts";

const registry_dependencies_cache = new Map<
  string,
  Package
>();

localStorage.removeItem("registry_dependencies_cache");

/** Get package.json of dependencies a given package */
export const get_registry_dependency = async (
  name: string,
  version: string,
  cache: boolean,
): Promise<Package> => {
  if (cache && registry_dependencies_cache.size === 0) {
    const cached = JSON.parse(
      localStorage.getItem("registry_dependencies_cache") ?? "[]",
    );
    for (const [key, value] of cached) {
      registry_dependencies_cache.set(key, value);
    }
  }

  const url = new URL(
    `${name}@${version}/package.json`,
    "https://unpkg.com/",
  );

  const found = registry_dependencies_cache.get(url.href);
  if (cache && found) return found;

  const registry_dependency = await fetch(url)
    .then((res) => res.json())
    .then(package_parser.parse);

  // We do not want to consider development dependencies
  registry_dependency.devDependencies = {};

  registry_dependencies_cache.set(url.href, registry_dependency);

  if (cache) {
    localStorage.setItem(
      "registry_dependencies_cache",
      JSON.stringify([...registry_dependencies_cache.entries()]),
    );
  } else {
    localStorage.removeItem("registry_dependencies_cache");
  }

  return registry_dependency;
};
