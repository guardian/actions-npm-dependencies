import { Package } from "./parse_dependencies.ts";

export type Identifier = `${string}@${string}`;

export type Issue = {
  severity: "info" | "warn" | "error";
  name: string;
  version: string;
  from?: string;
  message?: string;
};
export type Issues = Issue[];

export const get_identifier = (
  { name, version }: Pick<Package, "name" | "version">,
): Identifier => `${name}@${version}`;

export const non_nullable = <T>(_: T): _ is NonNullable<T> =>
  typeof _ !== "undefined";

export const get_all_dependencies = (
  { dependencies, devDependencies, optionalDependencies }: Pick<
    Package,
    "dependencies" | "devDependencies" | "optionalDependencies"
  >,
) =>
  [dependencies, devDependencies, optionalDependencies]
    .flatMap((dependency) => Object.entries(dependency));
