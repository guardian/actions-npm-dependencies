# actions-npm-dependencies

Validate your NPM dependencies without installing Node (WIP)

## How to get a health report for your `package.json`?

```
deno run \
    --allow-net=unpkg.com --allow-read=. \
    https://deno.land/x/package_health/src/main.ts \
    ./package.json  \
    --cache
```

> - The `--cache` flag should help with speedups
> - The `--verbose` flag is very verbose

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
