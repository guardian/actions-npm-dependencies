import { assertEquals } from "./deps.ts";
import { SemVer, Range } from "./deps.ts";
import { find_mismatched_peer_dependencies } from "./find_mismatches.ts";

Deno.test("Works when all depencies are matches", () => {
  assertEquals(
    find_mismatched_peer_dependencies([
      {
        name: "one",
        version: new SemVer("1.0.0"),
        peers: [
          {
            name: "two",
            optional: false,
            range: new Range("^2.0.0"),
          },
        ],
      },
      { name: "two", version: new SemVer("2.0.2"), peers: [] },
    ]),
    []
  );
});

Deno.test("Fails on invalid range", () => {
  assertEquals(
    find_mismatched_peer_dependencies([
      {
        name: "one",
        version: new SemVer("1.0.0"),
        peers: [
          {
            name: "two",
            optional: false,
            range: new Range("^2.0.3"),
          },
        ],
      },
      { name: "two", version: new SemVer("2.0.2"), peers: [] },
    ]),
    [
      {
        name: "two",
        optional: false,
        range: new Range("^2.0.3"),
        required_by: "one",
      },
    ]
  );
});

Deno.test("Allows optional deps to fail if absent", () => {
  assertEquals(
    find_mismatched_peer_dependencies([
      {
        name: "one",
        version: new SemVer("1.0.0"),
        peers: [
          {
            name: "two",
            optional: true,
            range: new Range("^2.0.3"),
          },
        ],
      },
    ]),
    []
  );
});
