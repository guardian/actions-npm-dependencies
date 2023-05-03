import { assert } from "https://deno.land/std@0.185.0/_util/asserts.ts";
import { package_health } from "./main.ts";

const get_package = (repo: string, path: string) =>
  fetch(
    new URL(
      `/guardian/${repo}/main/${path}`,
      "https://raw.githubusercontent.com/",
    ),
  ).then((r) => r.json());

// https://raw.githubusercontent.com/guardian/dotcom-rendering/main/dotcom-rendering/package.json

Deno.test(
  {
    name: "dotcom-rendering",
    ignore: !Deno.env.get("CI"),
    fn: async () => {
      const errors = await package_health(
        await get_package("dotcom-rendering", "dotcom-rendering/package.json"),
        { verbose: false, cache: true },
      );

      assert(errors <= 62); // let’s keep this lower!
    },
  },
);
