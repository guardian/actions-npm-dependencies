import { assertEquals, assertThrows, Range } from "./deps.ts";
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
      range: new Range("1.0.0"),
    },
    {
      name: "two",
      range: new Range("~1.1.0"),
    },
    {
      name: "three",
      range: new Range("^1.1.1"),
    },
    {
      name: "four",
      range: new Range("0.0.1"),
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
