<div align="center">
  <img src="brand/android-chrome-192x192.png" width="72" height="72" alt="cairnkit" />
  <h1>cairnkit</h1>
  <p><strong>In-app product tours that fail the build instead of the user.</strong></p>
</div>

---

Every tour tool breaks the same way. Someone renames a button, the tour keeps
pointing at a selector that no longer exists, and nobody finds out until a
customer sees a spotlight over empty space. The industry calls it onboarding
rot, and the usual answers — AI element fingerprinting, self-healing selectors
— all try to repair the damage _after_ it ships.

cairnkit moves the problem left. Tours are typed data in your repo, anchors are
verified in CI, and a broken tour fails the build.

```
✗ cairnkit check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - questions.save  (breaks "create-questions")  src/walkthrough/flows.ts:35
      Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.
```

---

## Supported versions

|               | Verified against                         |
| ------------- | ---------------------------------------- |
| React         | 18, 19                                   |
| Next.js       | 14, 15, 16 — App Router and Pages Router |
| Anything else | a ten-line router adapter                |

---

## Install

```bash
npx cairnkit init
```

Detects your framework and scaffolds the files below. It never overwrites
anything, and it prints the provider wiring rather than editing your layout.
`--dry-run` shows the plan; `--dir` chooses where files land.

Or by hand:

```bash
npm i @cairnkit/core @cairnkit/react @cairnkit/ui @cairnkit/next
npm i -D @cairnkit/cli
```

## 1 · Declare your anchors

```ts
// walkthrough/anchors.ts
import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  questions: { tabCreate: "questions.tab-create", save: "questions.save" },
});
```

## 2 · Mark the elements

One spread. Your components import nothing else.

```tsx
<button {...anchor(anchors.questions.tabCreate)}>Create question</button>
```

## 3 · Write the flow

```ts
import { defineFlow } from "@cairnkit/core";

export const createQuestions = defineFlow({
  id: "create-questions",
  version: 1,
  entryRoute: "/questions",
  steps: [
    {
      anchor: anchors.questions.tabCreate,
      title: "Start a new question",
      body: "Pick how you want to write it.",
      advanceOn: { type: "click" },
    },
  ],
});
```

## 4 · Mount it

```tsx
"use client";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";

export function Providers({ children }) {
  return (
    <CairnProvider
      flows={[createQuestions]}
      router={useAppRouterAdapter()}
      onEvent={(e) => analytics.capture(e.name, e.props)}
    >
      {children}
      <CairnOverlay />
      <TourLauncher flowId="create-questions" />
    </CairnProvider>
  );
}
```

## 5 · Wire the check into CI

```jsonc
"scripts": { "lint": "eslint . && cairnkit check" }
```

---

## What makes a tour survive

Five advance rules, so a step ends when the user has actually done the thing:

| Rule        | Advances when                       |
| ----------- | ----------------------------------- |
| `next`      | user presses Next                   |
| `click`     | user clicks the spotlit element     |
| `route`     | the pathname matches                |
| `event`     | your app calls `emitTourEvent(...)` |
| `condition` | another anchor appears              |

And three answers to the user not following the script — because they never do:

| Field           | Meaning                                       |
| --------------- | --------------------------------------------- |
| `resumeAt`      | they clicked ahead of the guide; catch up     |
| `handoffRoutes` | another guide covers this route; switch to it |
| `pauseRoutes`   | nobody covers this route; wait, don't die     |

`pauseRoutes` pauses rather than ends. Glancing at a different option should
cost the user nothing.

---

## Packages

| Package                             | What it is                                                    |
| ----------------------------------- | ------------------------------------------------------------- |
| [`@cairnkit/core`](packages/core)   | Engine. **Zero runtime dependencies**, 2.8 kb gzipped         |
| [`@cairnkit/react`](packages/react) | Headless hooks + provider. No styling, 4.0 kb                 |
| [`@cairnkit/ui`](packages/ui)       | Prebuilt spotlight, tooltip card, launcher. 7.0 kb (JS + CSS) |
| [`@cairnkit/next`](packages/next)   | App Router and Pages Router adapters                          |
| [`@cairnkit/cloud`](packages/cloud) | Optional. Reports tour events to cairnkit cloud, 2.8 kb       |
| [`@cairnkit/cli`](packages/cli)     | `cairnkit check`                                                 |

`core` is framework-free; React is one binding, not the architecture. Router
access goes through a ten-line adapter, so react-router or TanStack Router is
a small addition rather than a fork.

---

## Works inside modals

When a step points at a control inside a dialog, the overlay portals **into
that dialog** — inheriting its stacking context, staying interactive when the
page is marked `inert`, and remaining reachable inside a focus trap. Mounting
on `body` fails all three, which is why most tour tools break on modals.

---

## Bring your own everything

**Your styling.** `@cairnkit/ui` is optional and rebrands from one variable:

```css
:root {
  --cairn-accent: #f75c03;
  --cairn-accent-rgb: 247 92 3;
}
```

Light and dark are both defined, typography inherits from your app, and
`@cairnkit/react` is headless if you would rather build the overlay yourself.

**Your i18n.** Steps take literal `title`/`body`, or `titleKey`/`bodyKey`
resolved through a `translate` prop — next-intl, react-i18next or a plain
lookup all work.

**Your analytics.** One `onEvent` callback. Point it at PostHog, Segment,
Amplitude or your own endpoint.

---

## Docs

- [Theming](docs/THEMING.md) — tokens, light/dark, launcher placement, copy
- [Structure](docs/STRUCTURE.md) — packages, and why Tailwind/Radix are not dependencies
- [Releasing](docs/RELEASING.md) — changesets, provenance, publishing
- [Contributing](CONTRIBUTING.md) — setup, the checks, and how to open a PR
- [Security](SECURITY.md) — threat model, selector escaping, supply chain

MIT © cairnkit
