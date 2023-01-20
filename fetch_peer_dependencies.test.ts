import { assertEquals } from "./deps.ts";
import { Range, SemVer } from "./deps.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";

Deno.test("Can get peer dependencies", async () => {
  const with_peer_deps = await fetch_peer_dependencies([
    // { name: "@guardian/source-foundations", version: new SemVer("8.0.0") },
    {
      name: "@guardian/core-web-vitals",
      version: new SemVer("2.0.2"),
      peers: [],
    },
    // { name: "@guardian/libs", version: new SemVer("12.0.0") },
    // { name: "@guardian/ab-react", version: new SemVer("2.0.1") },
  ]);

  assertEquals(with_peer_deps, [
    {
      name: "@guardian/core-web-vitals",
      version: new SemVer("2.0.2"),
      peers: [
        {
          name: "@guardian/libs",
          range: new Range("^12.0.0"),
          optional: false,
        },
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          optional: false,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          optional: true,
        },
        {
          name: "web-vitals",
          range: new Range("^2.0.0"),
          optional: false,
        },
      ],
    },
  ]);
});

Deno.test("Can get optional peer dependencies", async () => {
  const peer_deps = await fetch_peer_dependencies([
    { name: "@guardian/libs", version: new SemVer("12.0.0"), peers: [] },
  ]);

  assertEquals(peer_deps, [
    {
      name: "@guardian/libs",
      version: new SemVer("12.0.0"),
      peers: [
        {
          name: "tslib",
          range: new Range("^2.4.1"),
          optional: false,
        },
        {
          name: "typescript",
          range: new Range("^4.3.2"),
          optional: true,
        },
      ],
    },
  ]);
});
