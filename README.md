# The Guardian Package Linter

Lint your `package.json` in line with our recommendations for
[dependencies](https://github.com/guardian/recommendations/blob/main/dependencies.md#javascript)
and
[packages](https://github.com/guardian/recommendations/blob/main/npm-packages.md).

> [!NOTE] In its current implementation, this linter will overwrite the
> `package.json` file that it processes.

Based on the value of the `private` field, the package will be interpreted as a
`lib` or an `app`, and processed accordingly.

## Usage

### With Node

```sh
npm install @guardian/package-linter;
npx package-linter ./package.json;
```

### With Deno

```sh
deno run -A https://deno.land/x/guardian_package_linter/src/cli.ts ./package.json
```

## Todo

This tool is still a work in progress, and here’s a list of things that we hope
it can solve in the future

- [ ] Be explicit about missing peer dependencies and try installing them
- [ ] Add a `--fix` flag and ensure it cannot be used in CI
- [ ] Ensure that chosen licenses are appropriate
- [ ] Improve distinctions between `app` and `lib`
- [ ] Automatically pick matching `@types/*` packages if they exist
- [ ] Rely on lock files to resolve version rather than the NPM registry
- [ ] Node version specified in `.nvmrc` compatible with `@types/node`
- [ ] Robust approach to handling known issues, and a way to evict them
- [ ] Better suggestions on how to resolve peer dependencies mismatch, including
      semver range intersections

## Tooling

See [Publint status](https://publint.dev/@guardian/package-linter)
