import { Range } from  "https://deno.land/std@0.177.0/semver/mod.ts";
import { assertEquals } from  "https://deno.land/std@0.177.0/testing/asserts.ts";
import { matched_types, mismatches } from "./check_types.ts";

Deno.test("will not complain on types without an associated pacakge", () => {
  const mismatches = matched_types([
    { name: "@types/node", range: new Range("~8.11") },
    { name: "typescript", range: new Range("^4.9") },
  ]);

  assertEquals(mismatches, []);
});

Deno.test("will find potential mismatches on types with an associated pacakge", () => {
  const matched = matched_types([
    { name: "@types/react", range: new Range("~16.1") },
    { name: "react", range: new Range("^16.1") },
  ]);

  assertEquals(matched, [
    {
      name: "react",
      range: new Range("^16.1"),
      type_range: new Range("~16.1"),
    },
  ]);
});

Deno.test("will error on caret ranges", () => {
  const mismatched = mismatches(matched_types([
    { name: "@types/react", range: new Range("^17") },
    { name: "react", range: new Range("^17") },
  ]));

  assertEquals(mismatched, [
    ["react", "Invalid notation. Only pinned and tilde (~) ranges allowed"],
  ]);
});

Deno.test("will error on wide ranges", () => {
  const mismatched = mismatches(matched_types([
    { name: "@types/react", range: new Range(">=17") },
    { name: "react", range: new Range("^17") },
  ]));

  assertEquals(mismatched, [
    ["react", "Invalid notation. Only pinned and tilde (~) ranges allowed"],
  ]);
});

Deno.test("will allow pinned versions", () => {
  const mismatched = mismatches(matched_types([
    { name: "@types/react", range: new Range("17") },
    { name: "react", range: new Range("17") },
  ]));

  assertEquals(mismatched, []);
});

Deno.test("will error on invalid major ranges", () => {
  const mismatched = mismatches(matched_types([
    { name: "@types/react", range: new Range("~17.1") },
    { name: "react", range: new Range("~18.1") },
  ]));

  assertEquals(mismatched, [
    ["react", "Mismatching major versions"],
  ]);
});

Deno.test("will error on invalid minor ranges", () => {
  const mismatched = mismatches(matched_types([
    { name: "@types/react", range: new Range("~17.1") },
    { name: "react", range: new Range("~17.0") },
  ]));

  assertEquals(mismatched, [
    ["react", "Mismatching minor versions"],
  ]);
});

Deno.test("will allow known errors ", () => {
  const mismatched = mismatches(
    matched_types([
      { name: "@types/scheduler", range: new Range("~0.16.2") },
      { name: "scheduler", range: new Range("~0.23.0") },
    ]),
    {
      known_issues: {
        "scheduler@~0.23.0": {
          "@types/scheduler": ["~0.16.2", "~0.23.0"],
        },
      },
    },
  );

  assertEquals(mismatched, []);
});
