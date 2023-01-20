import { parse_declared_dependencies } from "./parse_dependencies.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";
import { colour } from "./colours.ts";
import { find_mismatched_peer_dependencies } from "./find_mismatches.ts";

const [package_file] = Deno.args;

if (!package_file) {
  console.error("🚨 No package.json passed as argument");
  Deno.exit(1);
}

const filename = Deno.cwd() + "/" + package_file;

const package_content = await Deno.readTextFile(filename).catch(() => "");

if (package_content) {
  console.info(`✅ Found package.json file`);
} else {
  console.error("🚨 No package.json found at", colour.file(filename));
  Deno.exit(1);
}

const dependencies = parse_declared_dependencies(package_content);

if (dependencies.length === 0) {
  console.info("✅ You have no dependencies and therefore no issues!");
  Deno.exit();
}

const dependencies_with_peers = await fetch_peer_dependencies(dependencies);

const { length: number_of_mismatched_deps } = find_mismatched_peer_dependencies(
  dependencies_with_peers,
);

if (number_of_mismatched_deps === 0) {
  console.info("✅ Everything is fine with your dependencies");
} else {
  console.info("🚨 This shal");
}

Deno.exit(number_of_mismatched_deps);
