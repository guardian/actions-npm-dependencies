import { parse } from "https://deno.land/std@0.198.0/flags/mod.ts";
import { colour } from "./colours.ts";
import { package_health } from "./main.ts";
import { resolve } from "https://deno.land/std@0.198.0/path/mod.ts";
import { format } from "npm:prettier@3";

const { _: [package_file], verbose, errors, dry } = parse(Deno.args, {
  boolean: ["verbose", "dry"],
  string: ["errors"],
  default: { errors: "0", dry: false },
});

if (typeof package_file !== "string") {
  console.error("🚨 No package.json passed as argument");
  Deno.exit(1);
}

const is_remote_file = package_file.match(/^https?:\/\/.+/);

const package_content: unknown = is_remote_file
  ? await fetch(package_file).then((r) => r.json())
  : await Deno.readTextFile(resolve(package_file)).then(JSON.parse);

if (!package_content) {
  console.error("🚨 No package.json found at", colour.file(package_file));
  Deno.exit(1);
}

const { errors: problems, package_info } = await package_health(
  package_content,
  {
    verbose,
  },
);

if (package_info) {
  const output = await format(JSON.stringify(package_info), {
    parser: "json-stringify",
    useTabs: true,
    tabWidth: 4,
    printWidth: 80,
    bracketSpacing: true,
    bracketSameLine: false,
  });

  if (dry) {
    console.log(output);
  } else if (!is_remote_file) {
    await Deno.writeTextFile(
      resolve(package_file),
      output,
    );
  }
}

if (errors !== "0" && errors === problems.toString()) {
  // Pass if the number of problems matched the --errors flag
  console.info(`\nAll ${errors} errors found – this is a success!`);
  Deno.exit();
}

Deno.exit(problems);
