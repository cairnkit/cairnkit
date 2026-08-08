# @cairnkit/ui

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

### Patch Changes

- Updated dependencies [bbd9dcb]
  - @cairnkit/core@0.3.0
  - @cairnkit/react@0.3.0

## 0.2.3

### Patch Changes

- c0a7343: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight.
- a99bce5: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight. The arrow is now slightly larger, and its distance from the target scales with the step's padding.
- Updated dependencies [c0a7343]
- Updated dependencies [a99bce5]
  - @cairnkit/core@0.2.3
  - @cairnkit/react@0.2.3

## 0.2.2

### Patch Changes

- eaa3de3: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
- Updated dependencies [eaa3de3]
  - @cairnkit/core@0.2.2
  - @cairnkit/react@0.2.2

## 0.2.1

### Patch Changes

- e2f712d: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
- Updated dependencies [e2f712d]
  - @cairnkit/react@0.2.1
  - @cairnkit/core@0.2.1

## 0.2.0

### Minor Changes

- 5f4459d: Fix deep links being ignored when a tour was already running, and no longer restart a deep-linked tour after the user dismisses it. Expose package.json in the exports map so bundler plugins can read it.

### Patch Changes

- Updated dependencies [5f4459d]
  - @cairnkit/core@0.2.0
  - @cairnkit/react@0.2.0

## 0.1.0

### Minor Changes

- 92ff83c: First release. Typed anchors, five advance rules, resume/handoff/pause for users who go off-script, an overlay that works inside modals, and cairn check to fail CI when a tour points at UI that no longer exists.

### Patch Changes

- Updated dependencies [92ff83c]
  - @cairnkit/core@0.1.0
  - @cairnkit/react@0.1.0
