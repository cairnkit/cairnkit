---
"@cairnkit/ui": patch
"@cairnkit/cli": patch
"@cairnkit/core": patch
"@cairnkit/next": patch
"@cairnkit/react": patch
---

Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight. The arrow is now slightly larger, and its distance from the target scales with the step's padding.
