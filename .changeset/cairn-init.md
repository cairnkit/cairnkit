---
"@cairnkit/core": minor
"@cairnkit/react": minor
"@cairnkit/ui": minor
"@cairnkit/next": minor
"@cairnkit/cli": minor
---

Add `cairn init`.

```
npx @cairnkit/cli init
```

Detects the project and scaffolds anchors, a flow, the typed registry and a
provider — then tells you the two things it deliberately did not do.

It reads the framework (Next App Router, Next Pages Router, react-router v6 or
v7, plain React), whether source lives under `src/`, the tsconfig path alias,
TypeScript or JavaScript, and the package manager. Detection and planning are
pure functions over a small reader interface, so the whole matrix is tested
without touching a filesystem.

JavaScript projects get JavaScript — no `import type`, no annotations, and no
type registry, with a note saying plainly that the drift protection is the part
you lose without TypeScript.

Things it gets right because we got them wrong first:

- `@cairnkit/core` is always in the install command. Under pnpm the type
  registry does not compile without it, and npm hoisting hides that.
- The Next provider is marked `"use client"`.
- Imports are built from where the alias actually points. `"@/*": ["./*"]` and
  `"@/*": ["./src/*"]` need different specifiers for the same file, and it
  falls back to relative when the files sit outside the alias entirely.
- react-router v7 moved into the `react-router` package; the adapter follows
  whichever is installed.
- A router it does not support produces a stub that throws, not `memoryRouter`
  quietly swallowing every route-aware step.
- It warns when tsconfig `include` would leave the registry inert, which is a
  silent failure that just leaves every id typed as `string`.

It never overwrites an existing file, never writes outside the project, and
never edits your layout — a mangled root file is not worth the minute saved.
`--dry-run` prints the whole plan — files, install command and manual steps —
and writes nothing. `--dir` chooses where things land.

`pnpm test:init` runs the generated output through real installs and real
compilers across eight project shapes, because unit tests prove the plan is
right and only that proves the files work in someone else's repo.
