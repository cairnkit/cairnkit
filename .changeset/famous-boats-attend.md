---
"@cairnkit/cli": patch
"@cairnkit/core": patch
"@cairnkit/next": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
---

Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
