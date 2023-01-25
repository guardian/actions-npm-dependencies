import { assertEquals, Range } from "./deps.ts";
import {
  find_duplicates,
  parse_declared_dependencies,
} from "./parse_dependencies.ts";

Deno.test("Handles valid package.json", () => {
  const tuples = [
    ["one", "1.0.0"],
    ["two", "~1.1.0"],
    ["three", "^1.1.1"],
    ["four", "0.0.1"],
  ] satisfies [string, string][];

  assertEquals(parse_declared_dependencies(tuples), [
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
  const dependencies = parse_declared_dependencies([
    ["one", "1.0.1"],
    ["two", "2.0.1"],
    ["two", "2.0.2"],
  ]);
  const duplicates = find_duplicates(dependencies);

  assertEquals(duplicates, ["two"]);
});
