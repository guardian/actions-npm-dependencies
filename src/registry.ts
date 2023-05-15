import { format } from "./colours.ts";
import { package_parser } from "./parser.ts";

const cache = await caches.open("package-health");

/** Get package.json of dependencies a given package */
export const get_registry_dependency = async (
  name: string,
  version: string,
) => {
  const url = new URL(
    `${name}@${version}/package.json`,
    "https://unpkg.com/",
  );

  const interval = setInterval(() => {
    console.info(`║ Taking a while to download ${format(name, version)}`);
  }, 120);

  const found = await cache.match(url);
  const response = found ?? await fetch(url);

  if (!found) cache.put(url, response.clone());

  const registry_dependency = await response.json()
    .then(package_parser.parse);

  // We do not want to consider further
  registry_dependency.dependencies = {};

  // We do not want to consider development dependencies
  registry_dependency.devDependencies = {};

  clearInterval(interval);

  return registry_dependency;
};
