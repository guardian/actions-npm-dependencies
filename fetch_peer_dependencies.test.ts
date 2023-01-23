import { assertEquals, SemVer } from "./deps.ts";
import { Range } from "./deps.ts";
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
      versions: [new SemVer("2.0.2")],
      peers: [
        {
          name: "@guardian/libs",
          range: new Range("^12.0.0"),
          satisfied: false,
        },
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          satisfied: false,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          satisfied: true,
        },
        {
          name: "web-vitals",
          range: new Range("^2.0.0"),
          satisfied: false,
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
      versions: [new SemVer("12.0.0")],
      peers: [
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          satisfied: false,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          satisfied: true,
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
      versions: [new SemVer("12.0.0")],
      peers: [
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          satisfied: true,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          satisfied: false,
        },
      ],
    },
    {
      name: "tslib",
      range: new Range("2.4.1"),
      versions: [new SemVer("2.4.1")],
      peers: [],
    },
    {
      name: "typescript",
      range: new Range("4.2.2"),
      versions: [new SemVer("4.2.2")],
      peers: [],
    },
  ]);
});
