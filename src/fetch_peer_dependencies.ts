import { package_parser } from "./parse_dependencies.ts";

/** Get package.json of dependencies a given package */
export const get_registry_dependency = async (
  name: string,
  version: string,
) => {
  const url = new URL(
    `${name}@${version}/package.json`,
    "https://unpkg.com/",
  );

  const registry_dependency = await fetch(url)
    .then((res) => res.json())
    .then(package_parser.parse);

  // We do not want to consider further
  registry_dependency.dependencies = {};

  // We do not want to consider development dependencies
  registry_dependency.devDependencies = {};

  return registry_dependency;
};
