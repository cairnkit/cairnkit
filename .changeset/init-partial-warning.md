---
"@cairnkit/core": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
"@cairnkit/cli": patch
---

Warn when `cairn init` regenerates a flow beside anchors it kept.

The realistic partial case: someone ran `init`, edited their anchor registry,
then lost or deleted `flows.ts`. Keeping their registry is right — overwriting
it is never what anyone wants — but the flow it generates points at the example
ids (`nav.home`, `home.primary-action`) that their edited registry almost
certainly no longer contains. The result was a compile error the developer did
not cause and had no obvious way to attribute.

It now says so, and suggests `--dir` for a clean slate. Nothing else changes:
files are still never overwritten, and a full rerun is still a no-op.
