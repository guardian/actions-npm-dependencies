import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { find_duplicates } from "./duplicates.ts";
import type { get_all_dependencies } from "./utils.ts";

Deno.test("Warns on duplicate dependencies", () => {
  const package_info: Parameters<typeof get_all_dependencies>[0] = {
    dependencies: {
      "one": "1.0.0",
      "two": "2.0.0",
    },
    devDependencies: {
      "two": "2.2.2",
    },
    optionalDependencies: {},
  };
  const duplicates = find_duplicates(package_info);

  assertEquals(duplicates, [{ severity: "error", name: "two" }]);
});
