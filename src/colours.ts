import {
  cyan,
  gray,
  green,
  red,
  underline,
  yellow,
} from "https://deno.land/std@0.185.0/fmt/colors.ts";

export const colour = {
  dependency: cyan,
  file: underline,
  subdued: gray,
  version: yellow,
  valid: green,
  invalid: red,
};

export const format = (name: string, version: string) =>
  [
    colour.dependency(name),
    colour.subdued("@"),
    colour.version(version),
  ].join("");
