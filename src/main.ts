import {
  find_duplicates,
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
import { filter_types } from "./check_types.ts";

const { _: [package_file], verbose, cache, errors } = parse(Deno.args, {
  boolean: ["verbose", "cache"],
  string: ["errors"],
  default: { errors: "0" },
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

const { name, range, dependencies, devDependencies } = parse_package_info(
  package_content,
);

console.info(
  `╔═${"═".repeat(name.length)}╪${"═".repeat(range.range.length)}═╗`,
);
console.info(`╫ ${format(name, range)} ╫`);
console.info(
  `╠═${"═".repeat(name.length)}╪${"═".repeat(range.range.length)}═╝`,
);

const types_in_direct_dependencies = filter_types(Object.keys(dependencies));

if (types_in_direct_dependencies.length > 0) {
  console.error(
    `╟─ ${colour.invalid("✕")} ${
      colour.dependency("@types/*")
    } should only be present in devDependencies`,
  );
}

const dependencies_tuple: [name: string, range: string][] = [
  dependencies,
  devDependencies,
].map((_) => Object.entries(_)).flat();

const dependencies_from_package = parse_declared_dependencies(
  dependencies_tuple,
);

if (dependencies_from_package.length === 0) {
  if (verbose) {
    console.info("╰ You have no dependencies and therefore no issues!");
  }
  Deno.exit();
}

const duplicates = find_duplicates(dependencies_from_package);

if (duplicates.length > 0) {
  console.error(`╠╤ Duplicate dependencies found!`);
  for (const name of duplicates) {
    console.error(`║╰─ ${colour.invalid("✕")} ${colour.dependency(name)}`);
  }
}

const dependencies_from_registry = await fetch_peer_dependencies(
  dependencies_from_package,
  cache ? await caches.open("npm-registry-cache") : undefined,
);

format_dependencies(
  dependencies_from_registry,
  verbose,
);

const number_of_mismatched_deps = count_unsatisfied_peer_dependencies(
  dependencies_from_registry,
);

const problems = number_of_mismatched_deps +
  types_in_direct_dependencies.length + duplicates.length;

console.info("║");
console.info("╙───────────────────────────────────");

if (problems === 0) {
  if (verbose) {
    console.info(`${colour.valid("○")} Dependencies are in good shape`);
  }
} else if (problems === 1) {
  console.error(
    `${colour.invalid("✕")} There is ${
      colour.invalid("1")
    } dependencies problem`,
  );
} else {
  console.error(
    `${colour.invalid("✕")} There are ${
      colour.invalid(String(problems))
    } dependencies problems`,
  );
}

console.info("────────────────────────────────────");

if (errors !== "0" && errors === problems.toString()) {
  // Pass if the number of problems matched the --errors flag
  console.info(`\nAll ${errors} errors found – this is a success!`);
  Deno.exit();
}

Deno.exit(problems);
