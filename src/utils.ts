import { Package } from "./parse_dependencies.ts";

export type Identifier = `${string}@${string}`;

type Issue = {
  severity: "info" | "warn" | "error";
  name: string;
  version: string;
  from?: string;
};
export type Issues = Issue[];

export const get_identifier = (
  { name, version }: Pick<Package, "name" | "version">,
): Identifier => `${name}@${version}`;

export const non_nullable = <T>(_: T): _ is NonNullable<T> =>
  typeof _ !== "undefined";

export const get_all_dependencies = (
  { dependencies, devDependencies }: Pick<
    Package,
    "dependencies" | "devDependencies"
  >,
) =>
  [dependencies, devDependencies]
    .flatMap((dependency) => Object.entries(dependency));
