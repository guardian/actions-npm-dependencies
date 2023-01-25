import { assertEquals } from "./deps.ts";
import { matched_types, mismatches } from "./check_types.ts";

Deno.test("will not complain on types without an associated pacakge", () => {
  const mismatches = matched_types([
    ["@types/node", "~8.11"],
    ["typescript", "^4.9"],
  ]);

  assertEquals(mismatches, []);
});

Deno.test("will find potential mismatches on types with an associated pacakge", () => {
  const matched = matched_types([
    ["@types/react", "~16.1"],
    ["react", "^16.1"],
  ]);

  assertEquals(matched, [
    { name: "react", range: "^16.1", type_range: "~16.1" },
  ]);
});

Deno.test("will error on caret ranges", () => {
  const mismatched = mismatches(matched_types([
    ["@types/react", "^17"],
    ["react", "^17"],
  ]));

  assertEquals(mismatched, [
    ["react", "Invalid caret (^) notation. Use tilde (~) instead"],
  ]);
});

Deno.test("will error on invalid major ranges", () => {
  const mismatched = mismatches(matched_types([
    ["@types/react", "~17.1"],
    ["react", "~18.1"],
  ]));

  assertEquals(mismatched, [
    ["react", "Mismatching major versions"],
  ]);
});

Deno.test("will error on invalid minor ranges", () => {
  const mismatched = mismatches(matched_types([
    ["@types/react", "~17.1"],
    ["react", "~17.0"],
  ]));

  assertEquals(mismatched, [
    ["react", "Mismatching minor versions"],
  ]);
});
