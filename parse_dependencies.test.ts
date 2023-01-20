import { assertEquals, assertThrows, SemVer } from "./deps.ts";
import { parse_declared_dependencies } from "./parse_dependencies.ts";

Deno.test("Handles valid package.json", () => {
  const json = `
  {
    "dependencies": {
      "one": "1.0.0",
      "two": "~1.1.0"
    },
    "devDependencies": {
      "three": "^1.1.1",
      "four": "0.0.1"
    }
  }
  `;

  assertEquals(parse_declared_dependencies(json), [
    {
      name: "one",
      version: new SemVer("1.0.0"),
      peers: [],
    },
    {
      name: "two",
      version: new SemVer("1.1.0"),
      peers: [],
    },
    {
      name: "three",
      version: new SemVer("1.1.1"),
      peers: [],
    },
    {
      name: "four",
      version: new SemVer("0.0.1"),
      peers: [],
    },
  ]);
});

Deno.test("Warns on duplicate dependencies", () => {
  const json = `
  {
    "dependencies": {
      "one": "1.0.1",
      "two": "2.0.1"
    },
    "devDependencies": {
      "two": "2.0.2"
    }
  }
  `;

  assertThrows(() => parse_declared_dependencies(json));
});
