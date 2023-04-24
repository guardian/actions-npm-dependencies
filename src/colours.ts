import { cyan, gray, green, red, underline, yellow } from  "https://deno.land/std@0.177.0/fmt/colors.ts";
import { Range } from  "https://deno.land/std@0.177.0/semver/mod.ts";

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
