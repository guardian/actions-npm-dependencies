import { Dependency, DependencyIdentifier } from "./types.ts";

export const non_nullable = <T>(_: T): _ is NonNullable<T> =>
  typeof _ !== "undefined";

export const get_identifier = <T extends Dependency>(
  dependency: T,
): DependencyIdentifier<T> => `${dependency.name}@${dependency.range}`;
