import { major, minor, minVersion } from "./deps.ts";
import { isDefined } from "./utils.ts";

export const filter_types = (dependencies: string[]) =>
  dependencies.filter((dependency) => dependency.startsWith("@types/"));

export const matched_types = (dependencies: [string, string][]) =>
  dependencies.map(([name, range]) => {
    const [, type_range] = dependencies.find(([other_name]) =>
      other_name === `@types/${name}`
    ) ?? [];

    return type_range ? { name, range, type_range } : undefined;
  }).filter(isDefined);

export const mismatches = (dependencies: ReturnType<typeof matched_types>) =>
  dependencies.map(({ name, range, type_range }) => {
    if (range.startsWith("^") || type_range.startsWith("^")) {
      return [
        name,
        "Invalid caret (^) notation. Use tilde (~) instead",
      ] as const;
    }

    const main_min = minVersion(range);
    const type_min = minVersion(type_range);

    if (!main_min || !type_min) {
      return [name, "Invalid range or version types"] as const;
    }

    if (major(main_min) !== major(type_min)) {
      return [name, "Mismatching major versions"] as const;
    }
    if (minor(main_min) !== minor(type_min)) {
      return [name, "Mismatching minor versions"] as const;
    }

    return undefined;
  }).filter(isDefined);
