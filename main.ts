import { parse_declared_dependencies } from "./parse_dependencies.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";
import { colour } from "./colours.ts";
import { count_unsatisfied_peer_dependencies } from "./find_mismatches.ts";
import { parse } from "https://deno.land/std@0.168.0/flags/mod.ts";

const { _: [package_file], verbose, cache } = parse(Deno.args, {
  boolean: ["verbose", "cache"],
});

if (typeof package_file !== "string") {
  console.error("🚨 No package.json passed as argument");
  Deno.exit(1);
}

const filename = Deno.cwd() + "/" + package_file;

const package_content = await Deno.readTextFile(filename).catch(() => "");

if (package_content) {
  if (verbose) console.info(`✅ Found package.json file`);
} else {
  console.error("🚨 No package.json found at", colour.file(filename));
  Deno.exit(1);
}

const dependencies = parse_declared_dependencies(package_content);

if (dependencies.length === 0) {
  if (verbose) {
    console.info("✅ You have no dependencies and therefore no issues!");
  }
  Deno.exit();
}

const dependencies_with_peers = await fetch_peer_dependencies(
  dependencies,
  { verbose, cache },
);

const number_of_mismatched_deps = count_unsatisfied_peer_dependencies(
  dependencies_with_peers,
  verbose,
);

if (number_of_mismatched_deps === 0) {
  if (verbose) console.info("✅ Everything is fine with your dependencies");
} else {
  console.info(
    `🚨 There are ${
      colour.file(String(number_of_mismatched_deps))
    } unsatisfied peer dependencies`,
  );
}

Deno.exit(number_of_mismatched_deps);
