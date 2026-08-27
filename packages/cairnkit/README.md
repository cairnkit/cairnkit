# cairnkit

[![npm](https://img.shields.io/npm/v/cairnkit?label=npm&color=4f46e5)](https://www.npmjs.com/package/cairnkit) [![license](https://img.shields.io/npm/l/cairnkit?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![no install](https://img.shields.io/badge/no%20install-npx-4f46e5)

![A rename breaks a tour, and cairnkit check fails the build with the rule, the file and the line](https://raw.githubusercontent.com/cairnkit/cairnkit/main/brand/readme/check-fails.gif)

A launcher for [`@cairnkit/cli`](https://www.npmjs.com/package/@cairnkit/cli), so
the first command works before anything is installed:

```bash
npx cairnkit init     # scaffold a walkthrough into an existing app
npx cairnkit check    # fail the build when a tour points at UI that is gone
npx cairnkit status   # describe every anchor and which flows use it
```

That is all this package does. It has no code of its own, depends on
`@cairnkit/cli` at the same version, and hands straight over to it.

## What you get from `init`

It reads your project rather than assuming one. App Router or Pages Router,
`src/` or not, npm, pnpm, yarn or bun, TypeScript or JavaScript, and it names
the right file for each:

```
cairnkit init   Next.js App Router · TypeScript · npm

+  src/walkthrough/anchors.ts          every element a tour can point at
+  src/walkthrough/flows.ts            the tours themselves
+  src/walkthrough/cairn.d.ts          narrows ids to your own literals
+  src/walkthrough/cairn-provider.tsx  mounts the runtime
```

It never overwrites a file and never edits your layout. It prints that step
instead, because a mangled root file is not worth the minute it would save.

## Use `cairnkit`, not `cairn`

The binary answers to both names once the package is installed, and the CLI
always calls itself `cairnkit` in its own output.

Prefer `cairnkit` everywhere, and never write `npx cairn`. There is an unrelated
package called `cairn` on npm, so with nothing installed that command downloads
and runs a stranger's code. `npx cairnkit` resolves to this package from an
empty directory, which is the whole reason this package exists.

## The rest of cairnkit

| Package                                                            | What it is                                      |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| [`@cairnkit/core`](https://www.npmjs.com/package/@cairnkit/core)   | The engine. No framework, no dependencies.      |
| [`@cairnkit/react`](https://www.npmjs.com/package/@cairnkit/react) | Headless React bindings.                        |
| [`@cairnkit/ui`](https://www.npmjs.com/package/@cairnkit/ui)       | Prebuilt overlay: spotlight, card and launcher. |
| [`@cairnkit/next`](https://www.npmjs.com/package/@cairnkit/next)   | Next.js router adapters.                        |
| [`@cairnkit/cli`](https://www.npmjs.com/package/@cairnkit/cli)     | `check`, `status` and `init`.                   |

Docs: **[cairnkit.dev](https://cairnkit.dev)**

MIT
