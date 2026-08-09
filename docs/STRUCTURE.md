# Repository structure

How the packages fit together, what belongs where, and the rules that keep it that way.

---

## Principles

| Rule                              | Why                                                                        |
| --------------------------------- | -------------------------------------------------------------------------- |
| **Dependencies point inward**     | `cli` → `core`, `ui` → `react` → `core`. Never the reverse.                |
| **One primary export per file**   | Paths stay predictable. `resolve-anchor.ts` exports `resolveAnchor`.       |
| **~150 lines per file**           | Past that, a file is doing two jobs.                                       |
| **Barrels only at package roots** | One `index.ts` per package. Cross-layer re-exports hide cycles.            |
| **`core` has zero runtime deps**  | It is what everything else builds on. Keep it cheap to adopt.              |

---

## Packages

| Package           | Depends on  | Ships                                          |
| ----------------- | ----------- | ---------------------------------------------- |
| `@cairnkit/core`  | nothing     | Engine — anchors, flows, advance rules, events |
| `@cairnkit/react` | core        | Headless hooks + provider. No styling.         |
| `@cairnkit/ui`    | core, react | Styled components. Plain prefixed CSS.         |
| `@cairnkit/next`  | react       | App Router + Pages Router adapters             |
| `@cairnkit/cli`   | core        | `cairn check`                                  |

Splitting `react` from `ui` is what lets someone drive the engine with their own design system — and it is why we can ship styles without forcing Tailwind on anyone.

---

## Layout

```
packages/
├── core/src/
│   ├── anchors/
│   │   ├── define-anchors.ts     typed registry helper
│   │   ├── anchor.ts             the {...anchor(id)} prop spreader
│   │   ├── resolve-anchor.ts     DOM lookup, prefers visible matches
│   │   └── types.ts
│   ├── flows/
│   │   ├── define-flow.ts        authoring helper
│   │   ├── registry.ts           id -> flow lookup
│   │   ├── resume.ts             resolveResumeStep (pure, tested)
│   │   └── types.ts              TourFlow, TourStep, AdvanceRule
│   ├── engine/
│   │   ├── store.ts              observable state, useSyncExternalStore-ready
│   │   ├── advance-rules.ts      next | click | route | event | condition
│   │   ├── lifecycle.ts          pause / handoff / resume decisions
│   │   └── types.ts
│   ├── events/
│   │   ├── schema.ts             analytics event union
│   │   ├── emit.ts               app -> tour signals
│   │   └── types.ts
│   └── dom/
│       ├── rect.ts               measure + compare target rects
│       ├── observe-element.ts    wait for late-mounting anchors
│       └── scroll-into-view.ts   reduced-motion aware
│
├── react/src/
│   ├── provider/
│   │   ├── cairn-provider.tsx    mounts the runtime, owns the portal
│   │   └── cairn-context.ts
│   ├── components/
│   │   └── tour-anchor.tsx       escape hatch for components that swallow props
│   ├── hooks/
│   │   ├── use-tour.ts           the controller
│   │   ├── use-anchor-target.ts  resolve + wait + track
│   │   ├── use-step-copy.ts      inline strings or translate()
│   │   └── use-cairn-store.ts
│   └── adapters/
│       └── router.ts             RouterAdapter interface
│
├── ui/src/
│   ├── atoms/        button · icon-button · progress-dot · kbd
│   ├── molecules/    step-header · step-body · step-footer · progress-rail
│   ├── organisms/    step-card · spotlight · launcher
│   ├── theme/        tokens.css (light + dark) · index.css
│   └── lib/          cx.ts
│
├── next/src/
│   ├── app-router-adapter.ts
│   └── pages-router-adapter.ts
│
└── cli/src/
    ├── commands/check.ts
    ├── checks/       anchors-applied · anchors-registered · copy-present
    └── reporters/    console.ts
```

---

## Theming — light and dark from commit one

`ui/src/theme/tokens.css` defines every `--cairn-*` custom property in both modes:

```css
:root { /* light */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-cairn-theme="light"]) { /* dark */ }
}

[data-cairn-theme="dark"] { /* dark, forced */ }
```

The host's own theme toggle wins in both directions by stamping `data-cairn-theme`. Accent defaults to a neutral so nothing looks broken out of the box, and consumers point it at their brand in one line:

```css
:root { --cairn-accent: var(--my-brand-color); }
```

---

## What is deliberately not here

Tailwind, shadcn and Radix are all absent from the *published packages*, each
for its own reason.

**Tailwind** — a library shipping Tailwind classes forces every consumer to add our `dist` to their `content` globs, and pins them to our major version. Precompiling the utilities instead ships `.flex` and `.p-4` into their bundle, where it collides with theirs. `ui` ships plain `cairn-`prefixed CSS that drops into any React app, Tailwind or not.

**shadcn** — not a dependency; it copies source into a repo. Its value is the forty components you would otherwise write. We need four.

**Radix** — its Popover and Dialog trap focus. Our whole design depends on the user reaching *past* the popover to click the real element underneath. We would spend more effort defeating Radix than writing the behaviour.

All three are right for **`examples/next-app`**, and for a future `npx cairn add` registry that copies component source into the consumer's repo — where those dependencies already exist and are theirs to own. That gives the shadcn ergonomics without taxing every install.

---

## Testing

- **Unit** (`vitest`) — pure logic: `resume.ts`, `advance-rules.ts`, `registry.ts`
- **Integration** — `examples/next-app` is a real multi-route consumer, not a demo. Every route-dependent bug found so far (navigation race, resume-on-early-click, flow handoff) needed one to reproduce, and doubles as the Playwright fixture.

---

## Questions that were open, and how they landed

1. **Does `ui` earn a separate package?** Yes. It carries the only third-party
   runtime dependency (`@floating-ui/dom`) and a stylesheet, neither of which
   belongs in a headless install. Headless is 6.2 kb; the overlay adds 6.9.
2. **Does `dom/` belong in `core`, given core is otherwise environment-free?**
   Yes, but it must stay SSR-safe. `resolveAnchor` once read `document` in a
   default parameter, which threw during server rendering before any guard
   could run; there is a Node-environment test suite for that class of bug now.
3. **Naming.** `use-tour`. `walkthrough` is what the files are called, `cairn`
   is the brand, and the hook is about the tour.
