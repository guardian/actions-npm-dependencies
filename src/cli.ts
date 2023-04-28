import { parse } from "https://deno.land/std@0.185.0/flags/mod.ts";
import { colour } from "./colours.ts";
import { package_health } from "./main.ts";

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

const problems = await package_health(package_content, { verbose, cache });

if (errors !== "0" && errors === problems.toString()) {
  // Pass if the number of problems matched the --errors flag
  console.info(`\nAll ${errors} errors found – this is a success!`);
  Deno.exit();
}

Deno.exit(problems);
