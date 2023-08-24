import {
  cyan,
  gray,
  green,
  red,
  underline,
  yellow,
} from "https://deno.land/std@0.198.0/fmt/colors.ts";
import { SemVer } from "https://deno.land/std@0.198.0/semver/types.ts";
import { format as formatSemVer } from "https://deno.land/std@0.198.0/semver/format.ts";

export const colour = {
  dependency: cyan,
  file: underline,
  subdued: gray,
  version: yellow,
  valid: green,
  invalid: red,
};

export const format = (name: string, version: string | SemVer) =>
  [
    colour.dependency(name),
    colour.subdued("@"),
    colour.version(
      typeof version === "string" ? version : formatSemVer(version),
    ),
  ].join("");
