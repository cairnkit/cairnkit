---
"@cairnkit/core": patch
"@cairnkit/react": patch
---

Flag `anchor_missing` when the step that raised it was `optional`.

An optional step exists because the thing it points at legitimately may not be there: a panel that renders nothing when it has nothing to say, a section gated on data. cairnkit still reports the absence, since a step that skips for everybody is a step worth deleting, but until now it reported it identically to a genuine break. Any consumer counting `anchor_missing` therefore reported "broken anchors" every time a guide skipped a step exactly as its author intended, and the number that is supposed to mean "your tour points at UI that is gone" quietly stopped meaning it.

`props.optional` is now `true` on that event when the step declared itself optional, and absent otherwise, so:

- existing consumers see no change in shape or behaviour
- stored history keeps the meaning it had when it was written
- a consumer that wants to separate the two can filter on a truthy flag

Nothing changes about when the event fires or how an optional step behaves.

Found by dogfooding: cloud's own dashboard guide has a step pointing at its "Needs attention" panel, which only renders when something _is_ broken. On a healthy workspace that step skipped, booked a broken anchor, and the anchor then appeared in the very panel the step describes.
