import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { Package } from "./parse_dependencies.ts";
import { find_duplicates } from "./duplicates.ts";

Deno.test("Warns on duplicate dependencies", () => {
  const package_info: Pick<Package, "dependencies" | "devDependencies"> = {
    dependencies: {
      "one": "1.0.0",
      "two": "2.0.0",
    },
    devDependencies: {
      "two": "2.2.2",
    },
  };
  const duplicates = find_duplicates(package_info);

  assertEquals(duplicates, ["two"]);
});
