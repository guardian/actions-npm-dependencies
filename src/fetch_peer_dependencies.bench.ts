import { Range } from "std/semver/mod.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";

Deno.bench("Fetch without cache", async () => {
  await fetch_peer_dependencies(
    [
      {
        name: "@guardian/core-web-vitals",
        range: new Range("2.0.2"),
      },
    ],
    undefined,
  );
});

Deno.bench("Fetch with cache", async () => {
  await fetch_peer_dependencies(
    [
      {
        name: "@guardian/core-web-vitals",
        range: new Range("2.0.2"),
      },
    ],
    { cache: true },
  );
});

Deno.bench("Fetch large dependency with cache", async () => {
  await fetch_peer_dependencies(
    [
      {
        name: "typescript",
        range: new Range("4.9.3"),
      },
    ],
    { cache: true },
  );
});
