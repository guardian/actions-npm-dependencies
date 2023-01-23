import { assertEquals, Range, SemVer } from "./deps.ts";

import { count_unsatisfied_peer_dependencies } from "./find_mismatches.ts";

Deno.test("Works when all dependencies are matched", () => {
  assertEquals(
    count_unsatisfied_peer_dependencies([
      {
        name: "one",
        range: new Range("1.0.0"),
        versions: [new SemVer("1.0.0")],
        peers: [
          {
            name: "two",
            satisfied: true,
            range: new Range("^2.0.0"),
          },
          {
            name: "three",
            satisfied: true,
            range: new Range("^3.0.0"),
          },
        ],
      },
      {
        name: "two",
        range: new Range("2.0.2"),
        versions: [new SemVer("2.0.2")],
        peers: [
          { name: "four", satisfied: true, range: new Range("^4") },
        ],
      },
    ]),
    0,
  );
});

Deno.test("Fails on invalid range", () => {
  assertEquals(
    count_unsatisfied_peer_dependencies([
      {
        name: "one",
        range: new Range("1.0.0"),
        versions: [new SemVer("1.0.0")],
        peers: [
          {
            name: "two",
            satisfied: false,
            range: new Range("^2.0.3"),
          },
        ],
      },
      {
        name: "two",
        range: new Range("2.0.2"),
        versions: [new SemVer("2.0.2")],
        peers: [],
      },
    ]),
    1,
  );
});
