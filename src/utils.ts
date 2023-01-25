export const isDefined = <T>(_: T): _ is NonNullable<T> =>
  typeof _ !== "undefined";
