import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { mismatches } from "./check_types.ts";
import { format } from "./colours.ts";

Deno.test("will allow patch differences", () => {
  const mismatched = mismatches({
    devDependencies: {
      "@types/react": "17.0.1",
    },
    dependencies: {
      "react": "17.0.0",
    },
    optionalDependencies: {},
  });

  assertEquals(mismatched, []);
});

Deno.test("will error on invalid major ranges", () => {
  const mismatched = mismatches({
    devDependencies: { "@types/react": "17.1.0" },
    dependencies: { "react": "18.1.0" },
    optionalDependencies: {},
  });

  assertEquals(mismatched, [{
    severity: "error",
    name: "react",
    version: "18.1.0",
    from: format("@types/react", "17.1.0"),
    message: "major",
  }]);
});

Deno.test("will error on invalid minor ranges", () => {
  const mismatched = mismatches({
    devDependencies: { "@types/react": "17.1.0" },
    dependencies: { "react": "17.0.0" },
    optionalDependencies: {},
  });

  assertEquals(mismatched, [{
    severity: "error",
    name: "react",
    version: "17.0.0",
    from: format("@types/react", "17.1.0"),
    message: "minor",
  }]);
});

Deno.test("will allow known errors ", () => {
  const mismatched = mismatches({
    devDependencies: { "@types/scheduler": "0.16.2" },
    dependencies: { "scheduler": "0.23.0" },
    optionalDependencies: {},
  }, {
    "scheduler@0.23.0": ["@types/scheduler@0.16.2"],
  });

  assertEquals(mismatched, []);
});
