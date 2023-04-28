const get_package = (repo: string) =>
  fetch(
    new URL(
      `/${repo}/main/package.json`,
      "https://raw.githubusercontent.com/guardian/",
    ),
  ).then((r) => r.json());

Deno.test("dotcom-rendering", async () => {
});
