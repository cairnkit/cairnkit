---
"@cairnkit/core": minor
"@cairnkit/react": minor
"@cairnkit/ui": minor
"@cairnkit/next": minor
"@cairnkit/cli": minor
---

Add `onEnter` and `onExit` step hooks, and fix two `cairn check` blind spots.

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
