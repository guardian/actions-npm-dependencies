# actions-npm-dependencies

Validate your NPM dependencies without installing Node (WIP)

[Publint](https://publint.dev/@guardian/package-linter)

## How to get a health report for your `package.json`?

### With Deno

```sh
deno run -A https://deno.land/x/guardian_package_linter@latest/src/cli.ts ./package.json
```

### With Node

```sh
npm install @guardian/package-linter;
npx 
```

## Todo

- [x] Make it functional and composable
- [x] Handle peer dependencies
- [ ] Handle lock files? (probably not)
- [x] Great error messaging
- [ ] Investigate direct dependencies of dependencies, which may have peers
      themselves
- [ ] Give insight into possible resolution steps, including intersects

## Shapes

All sourced from
[Geometric Shapes](https://en.wikipedia.org/wiki/Geometric_Shapes_(Unicode_block))
and
[Box-drawing characters](https://en.wikipedia.org/wiki/Box-drawing_character) on
Wikipedia.

```sh
┌─┬┐  ╔═╦╗  ╓─╥╖  ╒═╤╕
│ ││  ║ ║║  ║ ║║  │ ││
├─┼┤  ╠═╬╣  ╟─╫╢  ╞═╪╡
└─┴┘  ╚═╩╝  ╙─╨╜  ╘═╧╛
╭─────────╮
│ ○ △ □ × │
╰─────────╯
```
