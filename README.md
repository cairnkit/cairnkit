<div align="center">
  <img src="brand/cairn-mark.svg" width="56" alt="Cairn" />
  <h1>Cairn</h1>
  <p><strong>In-app product tours that fail the build instead of the user.</strong></p>
</div>

---

Every tour tool breaks the same way. Someone renames a button, the tour keeps
pointing at a selector that no longer exists, and nobody finds out until a
customer sees a spotlight over empty space. The industry calls it onboarding
rot, and the usual answers — AI element fingerprinting, self-healing selectors
— all try to repair the damage *after* it ships.

Cairn moves the problem left. Tours are typed data in your repo, anchors are
verified in CI, and a broken tour fails the build.

```
✗ cairn check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - questions.save  (used by create-questions)
      Spread {...anchor(...)} on the element, or remove the step pointing at it.
```

---

## Install

```bash
npm i @cairnkit/react @cairnkit/next
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

export function Providers({ children }) {
  return (
    <CairnProvider
      flows={[createQuestions]}
      router={useAppRouterAdapter()}
      onEvent={(e) => analytics.capture(e.name, e.props)}
    >
      {children}
    </CairnProvider>
  );
}
```

## 5 · Wire the check into CI

```jsonc
"scripts": { "lint": "eslint . && cairn check" }
```

---

## What makes a tour survive

Five advance rules, so a step ends when the user has actually done the thing:

| Rule        | Advances when                          |
| ----------- | -------------------------------------- |
| `next`      | user presses Next                      |
| `click`     | user clicks the spotlit element        |
| `route`     | the pathname matches                   |
| `event`     | your app calls `emitTourEvent(...)`    |
| `condition` | another anchor appears                 |

And three answers to the user not following the script — because they never do:

| Field           | Meaning                                                 |
| --------------- | ------------------------------------------------------- |
| `resumeAt`      | they clicked ahead of the guide; catch up                |
| `handoffRoutes` | another guide covers this route; switch to it            |
| `pauseRoutes`   | nobody covers this route; wait, don't die                |

`pauseRoutes` pauses rather than ends. Glancing at a different option should
cost the user nothing.

---

## Packages

| Package                                    | What it is                                       |
| ------------------------------------------ | ------------------------------------------------ |
| [`@cairnkit/core`](packages/core)           | Engine. **Zero runtime dependencies.**           |
| [`@cairnkit/react`](packages/react)         | Headless hooks + provider. No styling.           |
| [`@cairnkit/next`](packages/next)           | App Router and Pages Router adapters             |
| [`@cairnkit/cli`](packages/cli)             | `cairn check`                                    |

`core` is framework-free; React is one binding, not the architecture. Router
access goes through a ten-line adapter, so react-router or TanStack Router is
a small addition rather than a fork.

---

## Bring your own everything

**Your styling.** `@cairnkit/react` ships no CSS. Drive `useTour()` with your
own components, or take the prebuilt ones.

**Your i18n.** Steps take literal `title`/`body`, or `titleKey`/`bodyKey`
resolved through a `translate` prop — next-intl, react-i18next or a plain
lookup all work.

**Your analytics.** One `onEvent` callback. Point it at PostHog, Segment,
Amplitude or your own endpoint.

---

## Docs

- [Structure](docs/STRUCTURE.md) — packages, layout, and why Tailwind/Radix are not dependencies
- [Security](SECURITY.md) — threat model, selector escaping, supply chain

MIT © Cairn
