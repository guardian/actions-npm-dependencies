import {
  parse_declared_dependencies,
  parse_package_info,
} from "./parse_dependencies.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";
import { colour, format } from "./colours.ts";
import {
  count_unsatisfied_peer_dependencies,
  format_dependencies,
} from "./find_mismatches.ts";
import { parse } from "https://deno.land/std@0.168.0/flags/mod.ts";

const { _: [package_file], verbose, cache } = parse(Deno.args, {
  boolean: ["verbose", "cache"],
});

if (typeof package_file !== "string") {
  console.error("🚨 No package.json passed as argument");
  Deno.exit(1);
}

const filename = Deno.cwd() + "/" + package_file;

const package_content: unknown = await Deno.readTextFile(filename).catch(() =>
  ""
).then(
  (contents) => JSON.parse(contents),
);

if (!package_content) {
  console.error("🚨 No package.json found at", colour.file(filename));
  Deno.exit(1);
}

const { name, range } = parse_package_info(package_content);

console.info(`${format(name, range)}`);

const dependencies_from_package = parse_declared_dependencies(package_content);

if (dependencies_from_package.length === 0) {
  if (verbose) {
    console.info("✅ You have no dependencies and therefore no issues!");
  }
  Deno.exit();
}

const dependencies_from_registry = await fetch_peer_dependencies(
  dependencies_from_package,
  { cache },
);

format_dependencies(
  dependencies_from_registry,
  verbose,
);

const number_of_mismatched_deps = count_unsatisfied_peer_dependencies(
  dependencies_from_registry,
);

if (number_of_mismatched_deps === 0) {
  if (verbose) console.info("✅ Dependencies are in good shape");
} else if (number_of_mismatched_deps === 1) {
  console.error(
    `🚨 There is ${colour.file("1")} dependencies problem`,
  );
} else {
  console.error(
    `🚨 There are ${
      colour.file(String(number_of_mismatched_deps))
    } dependencies problems`,
  );
}

Deno.exit(number_of_mismatched_deps);
