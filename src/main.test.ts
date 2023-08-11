import { assert } from "https://deno.land/std@0.185.0/_util/asserts.ts";
import { package_health } from "./main.ts";
import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.185.0/testing/mock.ts";

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
    name: "integration tests",
    ignore: !Deno.env.get("CI"),
    fn: async (test) => {
      stub(console, "log");
      stub(console, "info");
      stub(console, "warn");
      stub(console, "error");

      await test.step("packages with duplicates", async () => {
        const with_duplicates: unknown = await Deno.readTextFile(
          new URL(import.meta.resolve("../fixtures/package_duplicate.json")),
        ).then((contents) => JSON.parse(contents));

        const { errors } = await package_health(with_duplicates, {
          verbose: false,
        });

        assertEquals(errors, 2);
      });

      await test.step("packages with typescript", async () => {
        const with_duplicates: unknown = await Deno.readTextFile(
          new URL(import.meta.resolve("../fixtures/package_typescript.json")),
        ).then((contents) => JSON.parse(contents));

        const { errors } = await package_health(with_duplicates, {
          verbose: false,
        });

        assertEquals(errors, 6);
      });

      await test.step("a valid package", async () => {
        const with_duplicates: unknown = await Deno.readTextFile(
          new URL(import.meta.resolve("../fixtures/package_valid.json")),
        ).then((contents) => JSON.parse(contents));

        const { errors } = await package_health(with_duplicates, {
          verbose: false,
        });

        assertEquals(errors, 0);
      });

      await test.step("dotcom-rendering", async () => {
        const { errors } = await package_health(
          await get_package(
            "dotcom-rendering",
            "dotcom-rendering/package.json",
          ),
          { verbose: false },
        );

        assert(errors <= 33); // let’s keep this lower!
      });
    },
  },
);
