import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import {
  mismatches,
  to_types_package,
  types_matching_dependencies,
} from "./check_types.ts";

Deno.test("will not complain on types without an associated package", () => {
  const mismatches = types_matching_dependencies({
    devDependencies: {
      "@types/node": "18.11.1",
    },
    dependencies: {
      "typescript": "4.9.5",
    },
  });

  assertEquals(mismatches, []);
});

Deno.test("will find potential mismatches on types with an associated package", () => {
  const matched = types_matching_dependencies(
    {
      devDependencies: {
        "@types/react": "16.1.99",
      },
      dependencies: {
        "react": "16.1.0",
      },
    },
  );

  assertEquals(matched, [
    {
      name_untyped: "react",
      version_untyped: ("16.1.0"),
      name_typed: "@types/react",
      version_typed: ("16.1.99"),
    },
  ]);
});

Deno.test("will allow patch differences", () => {
  const mismatched = mismatches(types_matching_dependencies({
    devDependencies: {
      "@types/react": "17.0.1",
    },
    dependencies: {
      "react": "17.0.0",
    },
  }));

  assertEquals(mismatched, []);
});

Deno.test("will error on invalid major ranges", () => {
  const mismatched = mismatches(types_matching_dependencies({
    devDependencies: { "@types/react": "17.1.0" },
    dependencies: { "react": "18.1.0" },
  }));

  assertEquals(mismatched, [
    ["react", "major"],
  ]);
});

Deno.test("will error on invalid minor ranges", () => {
  const mismatched = mismatches(types_matching_dependencies({
    devDependencies: {
      "@types/react": "17.1.0",
    },
    dependencies: {
      "react": "17.0.0",
    },
  }));

  assertEquals(mismatched, [
    ["react", "minor"],
  ]);
});

Deno.test("will allow known errors ", () => {
  const mismatched = mismatches(
    types_matching_dependencies(
      {
        devDependencies: {
          "@types/scheduler": "0.16.2",
        },
        dependencies: {
          "scheduler": "0.23.0",
        },
      },
    ),
    {
      known_issues: {
        "scheduler@0.23.0": ["@types/scheduler@0.16.2"],
      },
    },
  );

  assertEquals(mismatched, []);
});

Deno.test("handles regular packages", () => {
  assertEquals(
    to_types_package("qs"),
    "@types/qs",
  );
});

// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master#what-about-scoped-packages
Deno.test("handles scoped packages", () => {
  assertEquals(
    to_types_package("@testing-library/jest-dom"),
    "@types/testing-library__jest-dom",
  );
});
