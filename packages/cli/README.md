# @cairnkit/cli

[![npm](https://img.shields.io/npm/v/@cairnkit%2Fcli?label=npm&color=4f46e5)](https://www.npmjs.com/package/@cairnkit/cli) [![license](https://img.shields.io/npm/l/@cairnkit%2Fcli?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![runs in](https://img.shields.io/badge/runs%20in-~1s-4f46e5)

![cairnkit check exiting 1 on an anchor that is registered but never applied](https://raw.githubusercontent.com/cairnkit/cairnkit/main/brand/readme/check-fails.gif)

`cairnkit check` — fails the build when a tour points at UI that no longer exists.

```bash
npm i -D @cairnkit/cli
```

```jsonc
"scripts": { "lint": "eslint . && cairnkit check" }
```

## Getting set up

```bash
npx cairnkit init
```

Detects your framework and scaffolds anchors, a flow, the typed registry and a
provider. It never overwrites a file and never edits your layout — it prints
that step instead. `--dry-run` shows the plan; `--dir` chooses where files go.

## Checking

Run it directly with `npx`, since the binary is a local dev dependency rather
than a global one:

```bash
npx cairnkit check                    # defaults to src
npx cairnkit check src app            # several roots, scanned as one project
```

```
✗ cairnkit check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - questions.save  (breaks "create-questions")  src/walkthrough/flows.ts:35
      Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.
```

## Describing what is there

`check` answers "is anything wrong". `status` answers "what is there": every
anchor, whether an element carries it, where it was declared, and which flows
point at it. It always exits 0, because describing a project is not a verdict
on it.

```bash
npx cairnkit status                   # readable
npx cairnkit status --json            # the anchor graph, for tooling
```

`--json` works on both commands. In that mode stdout carries exactly one JSON
object and every human-facing message goes to stderr, so it pipes straight into
a parser:

```bash
npx cairnkit check --json | jq '.findings[].detail[].at'
```

The payload carries a `version` field. It is a contract the moment anything
consumes it, and a consumer needs to tell an old shape from a new one without
guessing from which keys happen to be present.

## What it checks

- Every registered anchor is applied to a real element
- Every `data-cairn` in the codebase is in the registry
- No route is both a pause route and a handoff route, and no flow hands off to
  itself

Runs in about a second, reads text only, and never imports or executes your
project code.

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
