# @cairnkit/core

## 0.4.2

### Patch Changes

- 7c91af9: Fix the spotlight landing in the wrong place inside modals and drawers.

  When a step points at something in a dialog, the overlay portals into that
  dialog so it survives focus traps and `inert`. The tooltip positioned itself
  correctly, but the spotlight ring did not — it highlighted empty space, often
  an element behind the dialog, while the dialog itself sat under an uncut scrim.

  `.cairn-root` is `position: fixed; inset: 0`, so its box is normally the
  viewport and target rects from `getBoundingClientRect` can be used as-is. But
  an ancestor with `transform`, `filter`, `backdrop-filter`, `perspective`,
  `contain` or `will-change` becomes the containing block for fixed descendants.
  The root then shrinks to that element and every coordinate is off by its
  origin. Drawers hit this every time, because sliding one in means transforming
  it.

  The overlay now measures its own root and offsets the spotlight by it, which
  is a no-op when the containing block really is the viewport.

## 0.4.1

### Patch Changes

- 7db5f02: Warn when `start()` is given a flow the provider does not know.

  It returned silently, so a launcher wired to a missing flow id did nothing at
  all and said nothing about why. Found by building the docs playground, where a
  second provider legitimately does not know the first one's flows — the launcher
  rendered, clicked, and no tour started.

  The warning names the flow and lists what the provider does know. It uses
  `devWarn`, so it costs nothing in production builds. `devWarn` is now exported
  from `@cairnkit/core` for the same reason.

## 0.4.0

### Minor Changes

- 6ae8bf4: Add `useTourAction`, and fix an install that never worked under pnpm.

  Both found by integrating the SDK into a real application.

  **Step hooks can now reach component state.** `onEnter` and `onExit` shipped in
  0.3.0 with a worked example that closed a modal by calling `closeSettings()`
  directly. That only compiles if the flow is declared where the setter is in
  scope — which is never, for anyone following the recommended layout, because
  flows are module-level data. The hooks were unusable for the exact case they
  were added for.

  Components now publish named actions, and steps call them:

  ```tsx
  useTourAction("settings:close", () => setOpen(false));
  ```

  ```ts
  onExit: (direction, ctx) => ctx.run("settings:close");
  ```

  Both hooks receive a `StepContext` as their last argument, so existing
  callbacks are unaffected. Action names narrow through `CairnRegister.actions`
  like anchors and events do. The registry is per-provider rather than
  module-level: a module-level map would be shared across requests during server
  rendering and collide between two providers on one page.

  **`@cairnkit/core` is now in the documented install command.** It was missing
  everywhere. npm hoists it as a transitive dependency so nobody noticed, but
  pnpm does not, and `declare module "@cairnkit/core"` — the typed-anchor
  registry, the headline feature — fails to compile without it. `@cairnkit/react`
  additionally re-exports `defineFlow`, `defineAnchors` and `anchor` so authoring
  a flow needs one import instead of two.

  **Sizes are measured, not remembered.** `pnpm size` prints gzipped sizes and
  `pnpm size:check` fails CI when the landing page disagrees. Correcting the
  hand-written numbers: core 2.7 kb, react 3.1 kb, ui 6.7 kb, headless 6.1 kb.
  "Everything" was overstated at 18.8 kb and actually costs 16.6 kb.

## 0.3.0

### Minor Changes

- bbd9dcb: Add `onEnter` and `onExit` step hooks, and fix two `cairn check` blind spots.

  Found by integrating the SDK into a real application rather than an example.

  **Step lifecycle hooks.** A step anchored inside a modal left the tour stranded:
  the next step's target sits behind the dialog, so Next moved the spotlight onto
  something the user could not reach. Steps now take `onEnter` and
  `onExit(direction)`. `onExit` is awaited before the next step measures, so an
  animated close finishes first instead of being measured mid-transition. Hooks
  that throw are logged and the tour continues — a broken hook must not strand
  anyone mid-flow.

  `advance()` and `back()` keep their `() => void` signatures; the move is
  deferred internally rather than handed to the caller as a promise.

  **`cairn check` accepts multiple paths.** `cairn check src app` scanned only
  `src` and silently reported success for anchors it never looked at.

  **`cairn check` sees config-driven anchors.** Anchors passed as data — through a
  prop, or a config object, rather than written inline as JSX — read as unused,
  so deleting a live anchor still passed. The scanner now matches registered
  anchor strings anywhere outside the registry itself.

## 0.2.3

### Patch Changes

- c0a7343: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight.
- a99bce5: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight. The arrow is now slightly larger, and its distance from the target scales with the step's padding.

## 0.2.2

### Patch Changes

- eaa3de3: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.

## 0.2.1

### Patch Changes

- e2f712d: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.

## 0.2.0

### Minor Changes

- 5f4459d: Fix deep links being ignored when a tour was already running, and no longer restart a deep-linked tour after the user dismisses it. Expose package.json in the exports map so bundler plugins can read it.

## 0.1.0

### Minor Changes

- 92ff83c: First release. Typed anchors, five advance rules, resume/handoff/pause for users who go off-script, an overlay that works inside modals, and cairn check to fail CI when a tour points at UI that no longer exists.
