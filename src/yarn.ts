import yarnLockfileParser from "npm:@yarnpkg/lockfile";
import { parse } from "npm:@types/yarnpkg__lockfile";

const [path_package, path_lockfile] = Deno.args;

if (!path_package || !path_lockfile) {
  throw new Error("Missing path to package.json & yarn.lock");
}

const { dependencies } = JSON.parse(await Deno.readTextFile(path_package));

const { object: json } = (yarnLockfileParser.parse as typeof parse)(
  await Deno.readTextFile(path_lockfile),
);

console.log("{");
for (const [name, version] of Object.entries(dependencies)) {
  const pinned = json[name + "@" + version]?.version;
  console.log(`"${name}": "${pinned ?? version}"`);
}
console.log("}");

console.info(
  "\n",
  "These are the currently resolved exact versions of your packages",
);
