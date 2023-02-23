import { cyan, gray, green, red, underline, yellow } from "std/fmt/colors.ts";
import { Range } from "std/semver/mod.ts";

export const colour = {
  dependency: cyan,
  file: underline,
  subdued: gray,
  version: yellow,
  valid: green,
  invalid: red,
};

export const format = (name: string, range: Range) =>
  [
    colour.dependency(name),
    colour.subdued("@"),
    colour.version(range.raw),
  ].join("");
