# Theming

> Type safety for anchors and flow ids is opt-in — see [Type registry](#type-registry) at the end.

cairnkit renders inside your product, so it defers to your brand rather than
imposing one. Everything visual is a CSS custom property, and light and dark
are both defined out of the box.

---

## Brand it in one line

```css
:root {
  --cairn-accent: #f75c03;
  --cairn-accent-rgb: 247 92 3; /* same colour, space-separated, for alpha */
}
```

That repaints the spotlight ring, the progress rail, the primary button, focus
rings and the launcher waves. Nothing else is required.

> `--cairn-accent-rgb` exists because CSS cannot decompose a hex value for
> `rgb(… / alpha)`. If you set the accent and skip the triplet, glows and rings
> keep the previous colour — a mismatch that is easy to miss on a dark UI.

Already have brand variables? Point at them:

```css
:root {
  --cairn-accent: var(--brand-primary);
  --cairn-accent-rgb: var(--brand-primary-rgb);
}
```

---

## Light and dark

Three layers, in order of specificity:

```css
:root {
  /* light */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-cairn-theme="light"]) {
    /* dark */
  }
}

[data-cairn-theme="dark"] {
  /* dark, forced */
}
```

The OS preference is the default signal. If your app has its own toggle, stamp
`data-cairn-theme="dark"` or `"light"` on `<html>` and it wins in both
directions — including forcing light while the OS is dark, which the media
query alone cannot do.

---

## Every token

| Token                     | Controls                                   |
| ------------------------- | ------------------------------------------ |
| `--cairn-accent`          | ring, rail, primary button, focus, waves   |
| `--cairn-accent-rgb`      | the same colour where alpha is needed      |
| `--cairn-accent-contrast` | text on the primary button                 |
| `--cairn-surface`         | card and launcher background               |
| `--cairn-surface-border`  | their border                               |
| `--cairn-text`            | titles and primary text                    |
| `--cairn-text-muted`      | body copy, step counter, quiet buttons     |
| `--cairn-rail`            | unfilled progress segments                 |
| `--cairn-hover`           | hover wash on ghost and icon buttons       |
| `--cairn-scrim`           | the dimmed backdrop                        |
| `--cairn-radius`          | card corners                               |
| `--cairn-shadow`          | card and launcher elevation                |
| `--cairn-font`            | typeface — **inherits by default**         |
| `--cairn-duration`        | transition length                          |
| `--cairn-ease`            | transition curve                           |
| `--cairn-z`               | stacking. Raise if your chrome sits higher |
| `--cairn-launcher-inset`  | launcher distance from the viewport edge   |

Typography inherits deliberately. An overlay that shipped its own typeface
would look like a third-party widget bolted onto your product, which is exactly
what it should not look like.

---

## Copy

**Step content** lives on the step:

```ts
{ anchor: anchors.invite.send, title: "Send it", body: "Nothing goes out until you click." }
```

Or through your i18n catalogue, so tenant vocabulary and locale keep working:

```ts
{ anchor: anchors.invite.send, titleKey: "tour.invite.send.title", bodyKey: "tour.invite.send.body" }
```

```tsx
<CairnProvider translate={(key) => t(key)} … />
```

**Chrome labels** are on the overlay:

```tsx
<CairnOverlay
  labels={{
    next: "Continue",
    back: "Previous",
    skip: "Not now",
    done: "Finish",
    counter: (current, total) => `${current} / ${total}`,
  }}
/>
```

---

## The launcher

```tsx
<TourLauncher flowId="invite-candidate" position="bottom-left" />
```

| `position`                              | Behaviour                      |
| --------------------------------------- | ------------------------------ |
| `bottom-right` (default)                | classic floating action button |
| `bottom-left` · `bottom-center`         | out of a support widget's way  |
| `top-right` · `top-left` · `top-center` | for apps with a bottom bar     |
| `inline`                                | sits in normal flow, 36px      |

`inline` is the one to reach for when you want it beside a page title rather
than floating:

```tsx
<h1>
  Pipeline <TourLauncher flowId="invite-candidate" position="inline" />
</h1>
```

Nudge a floating launcher clear of a chat bubble without moving it:

```css
:root {
  --cairn-launcher-inset: 96px;
}
```

### Your own icon

```tsx
<TourLauncher flowId="invite-candidate" icon={<YourLogo />} />
```

The component owns the slot; you own the artwork. Whatever you pass is clamped
to **20px floating, 17px inline**, so a 64px logo produces a correct launcher
rather than a broken one.

| Do                               | Why                                   |
| -------------------------------- | ------------------------------------- |
| Ship an SVG using `currentColor` | Inherits light and dark automatically |
| Use a `24x24` viewBox            | Scales cleanly to every slot size     |
| Keep it a single glyph           | It renders at 20px — detail is lost   |

Resize the slot if you need to:

```css
:root {
  --cairn-launcher-icon: 24px;
}
```

---

## Replacing the UI entirely

`@cairnkit/ui` is optional. `@cairnkit/react` is headless — build your own
overlay against `useTour()` and skip this package:

```tsx
const { step, rect, stepIndex, advance, skip } = useTour();
```

You lose the prebuilt spotlight, the dialog-aware portalling and the tooltip
positioning, which are the parts most worth keeping. Take the tokens first.

---

## Type registry

Anchors and flow ids default to `string`, so cairnkit works without any setup.
Register them once and the whole API narrows to your own literals:

```ts
// src/cairn.d.ts
import type { anchors } from "./walkthrough/anchors";

declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "invite-candidate" | "write-question";
    events: "invite:sent" | "question:saved";
  }
}
```

After that a typo cannot compile:

```
Type '"totally.made.up"' is not assignable to type
  '"nav.pipeline" | "nav.questions" | "pipeline.stats" | ...'

Type '"not-a-real-flow"' is not assignable to type
  '"invite-candidate" | "write-question"'
```

Which means the three ways a tour can rot are each caught at a different stage:

| Mistake                                      | Caught by        | When        |
| -------------------------------------------- | ---------------- | ----------- |
| Typo in an anchor, flow id, or event name    | TypeScript       | as you type |
| Wrong placement, advance rule, or prop shape | TypeScript       | as you type |
| Anchor deleted from the UI                   | `cairnkit check`    | in CI       |
| Anchor exists but never renders              | Playwright audit | in CI       |
