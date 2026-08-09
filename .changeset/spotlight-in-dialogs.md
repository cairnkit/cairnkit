---
"@cairnkit/core": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
"@cairnkit/cli": patch
---

Fix the spotlight landing in the wrong place inside modals and drawers.

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
