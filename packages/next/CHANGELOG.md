# @cairnkit/next

## 0.2.3

### Patch Changes

- c0a7343: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight.
- a99bce5: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight. The arrow is now slightly larger, and its distance from the target scales with the step's padding.
- Updated dependencies [c0a7343]
- Updated dependencies [a99bce5]
  - @cairnkit/react@0.2.3

## 0.2.2

### Patch Changes

- eaa3de3: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
- Updated dependencies [eaa3de3]
  - @cairnkit/react@0.2.2

## 0.2.1

### Patch Changes

- e2f712d: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
- Updated dependencies [e2f712d]
  - @cairnkit/react@0.2.1

## 0.2.0

### Minor Changes

- 5f4459d: Fix deep links being ignored when a tour was already running, and no longer restart a deep-linked tour after the user dismisses it. Expose package.json in the exports map so bundler plugins can read it.

### Patch Changes

- Updated dependencies [5f4459d]
  - @cairnkit/react@0.2.0

## 0.1.0

### Minor Changes

- 92ff83c: First release. Typed anchors, five advance rules, resume/handoff/pause for users who go off-script, an overlay that works inside modals, and cairn check to fail CI when a tour points at UI that no longer exists.

### Patch Changes

- Updated dependencies [92ff83c]
  - @cairnkit/react@0.1.0
