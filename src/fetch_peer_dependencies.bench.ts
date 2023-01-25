import { Range } from "./deps.ts";
import { fetch_peer_dependencies } from "./fetch_peer_dependencies.ts";

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

Deno.bench("Fetch without cache", async () => {
  await fetch_peer_dependencies(
    [
      {
        name: "@guardian/core-web-vitals",
        range: new Range("2.0.2"),
      },
    ],
    { cache: false },
  );
});
