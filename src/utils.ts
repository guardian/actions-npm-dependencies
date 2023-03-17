import { Dependency, DependencyIdentifier } from "./types.ts";

export const isDefined = <T>(_: T): _ is NonNullable<T> =>
  typeof _ !== "undefined";

export const get_identifier = <T extends Dependency>(
  dependency: T,
): DependencyIdentifier<T> => `${dependency.name}@${dependency.range}`;
