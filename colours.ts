import {
  blue,
  cyan,
  gray,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.171.0/fmt/colors.ts";

import { Range } from "./deps.ts";

export const colour = {
  dependency: blue,
  file: cyan,
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
