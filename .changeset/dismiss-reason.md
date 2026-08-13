---
"@cairnkit/core": minor
"@cairnkit/react": minor
"@cairnkit/ui": minor
---

Tell apart *how* someone left a tour.

Three controls end a tour — the Skip button, the X on the card, and the Escape
key — and until now all three emitted an identical `flow_dismissed`. Collapsing
them threw away the most actionable signal a guide produces, because the three
argue for opposite fixes:

- **skipped** — they rejected the tour. A step that concentrates these is
  probably not worth showing.
- **closed** — they pressed the X. Very often *not* rejection, but "move this
  box, it is covering the thing I am trying to look at". Cutting the step would
  be the wrong response to what is really a placement bug.
- **escape** — reflex, and frequently accidental.

`flow_dismissed` now carries `reason`, and `useTour().skip()` accepts one:

```ts
tour.skip(); // "skipped", unchanged
tour.skip("closed");
```

`reason` is optional throughout, so existing hosts, custom stores and overlays
keep compiling and keep working — an overlay that does not say which control was
used leaves the field absent rather than guessing, so "we do not know" stays
distinguishable from "they pressed Skip".

**Accessibility fix:** the X in the card was labelled with the `skip` label, so
it and the adjacent Skip button announced the same accessible name with no way
to tell them apart. It now has its own `close` label, defaulting to "Close" and
overridable like the rest:

```tsx
<CairnOverlay labels={{ skip: "Not now", close: "Close" }} />
```

`StepCard` also gains an optional `onClose`, falling back to `onSkip` when a
host has not supplied it.
