// ex. scripts/build_npm.ts
import { build, emptyDir } from "https://deno.land/x/dnt@0.38.0/mod.ts";
import { tag } from "./get_git_tag.ts";
import { package_health } from "./main.ts";
import { resolve } from "https://deno.land/std@0.198.0/path/mod.ts";

const dir = "./npm";

await emptyDir(dir);
await build({
  entryPoints: ["./src/cli.ts"],
  outDir: dir,
  scriptModule: false,
  typeCheck: false,
  shims: {
    deno: true,
  },
  package: {
    name: "@guardian/package-linter",
    version: tag,
    description:
      "The Guardian package linter that helps you follow our recommendations",
    license: "Apache-2",
    contributors: ["@aracho1", "@mxdvl"],
    main: "esm/main.js",
    bin: {
      "package-linter": "esm/cli.js"
    },
    repository: {
      type: "git",
      url: "git+https://github.com/guardian/actions-npm-dependencies.git",
    },
    bugs: {
      url: "https://github.com/guardian/actions-npm-dependencies/issues",
    },
    // We’re going to validate the output with out very own linter!
    known_issues: {
      "@deno/shim-deno@~0.16.1": ["because that’s the DNT way"],
      "@types/node@^18.11.9": ["development dependency"],
      "picocolors@^1.0.0": ["development dependency"],
    },
  },
  postBuild: async () => {
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");
  },
});

// check that our generated package.json is valid
const package_contents = await Deno.readTextFile(resolve(dir + "/package.json"))
  .then(
    JSON.parse,
  );
const { errors } = await package_health(package_contents, { verbose: false });

Deno.exit(errors === 0 ? 0 : 1);
