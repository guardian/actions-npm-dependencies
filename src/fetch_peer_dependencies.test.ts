import { assertEquals } from  "https://deno.land/std@0.177.0/testing/asserts.ts";
import { Range, SemVer } from  "https://deno.land/std@0.177.0/semver/mod.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";

Deno.test("Can get peer dependencies", async () => {
  const with_peer_deps = await fetch_peer_dependencies([
    {
      name: "@guardian/core-web-vitals",
      range: new Range("2.0.2"),
    },
  ]);

  assertEquals(with_peer_deps, [
    {
      name: "@guardian/core-web-vitals",
      range: new Range("2.0.2"),
      version: new SemVer("2.0.2"),
      dependencies: [],
      peers: [
        {
          name: "@guardian/libs",
          range: new Range("^12.0.0"),
          satisfied: false,
          local: undefined,
        },
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          satisfied: false,
          local: undefined,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          satisfied: true,
          local: undefined,
        },
        {
          name: "web-vitals",
          range: new Range("^2.0.0"),
          satisfied: false,
          local: undefined,
        },
      ],
    },
  ]);
});

Deno.test("Can get optional peer dependencies", async () => {
  const peer_deps = await fetch_peer_dependencies([
    { name: "@guardian/libs", range: new Range("12.0.0") },
  ]);

  assertEquals(peer_deps, [
    {
      name: "@guardian/libs",
      range: new Range("12.0.0"),
      version: new SemVer("12.0.0"),
      dependencies: [],
      peers: [
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          satisfied: false,
          local: undefined,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          satisfied: true,
          local: undefined,
        },
      ],
    },
  ]);
});

Deno.test("Will fail on optional dependencies that are defined locally", async () => {
  const peer_deps = await fetch_peer_dependencies([
    { name: "@guardian/libs", range: new Range("12.0.0") },
    { name: "tslib", range: new Range("2.4.1") },
    { name: "typescript", range: new Range("4.2.2") },
  ]);

  assertEquals(peer_deps, [
    {
      name: "@guardian/libs",
      range: new Range("12.0.0"),
      version: new SemVer("12.0.0"),
      dependencies: [],
      peers: [
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          satisfied: true,
          local: new Range("2.4.1"),
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          satisfied: false,
          local: new Range("4.2.2"),
        },
      ],
    },
    {
      name: "tslib",
      range: new Range("2.4.1"),
      version: new SemVer("2.4.1"),
      dependencies: [],
      peers: [],
    },
    {
      name: "typescript",
      range: new Range("4.2.2"),
      version: new SemVer("4.2.2"),
      dependencies: [],
      peers: [],
    },
  ]);
});
