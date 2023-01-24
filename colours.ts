import {
  blue,
  cyan,
  gray,
  yellow,
} from "https://deno.land/std@0.171.0/fmt/colors.ts";

import { Range } from "./deps.ts";

export const colour = {
  dependency: blue,
  file: cyan,
  subdued: gray,
  version: yellow,
};

export const format = (name: string, range: Range) =>
  [
    colour.dependency(name),
    colour.subdued("@"),
    colour.version(range.raw),
  ].join("");
