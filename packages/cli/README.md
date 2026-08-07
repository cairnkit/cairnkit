# @cairnkit/cli

`cairn check` — fails the build when a tour points at UI that no longer exists.

```bash
npm i -D @cairnkit/cli
```

```jsonc
"scripts": { "lint": "eslint . && cairn check" }
```

```
✗ cairn check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - questions.save  (breaks "create-questions")  src/walkthrough/flows.ts:35
      Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.
```

## What it checks

- Every registered anchor is applied to a real element
- Every `data-cairn` in the codebase is in the registry
- No route is both a pause route and a handoff route, and no flow hands off to
  itself

Runs in about a second, reads text only, and never imports or executes your
project code.

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
