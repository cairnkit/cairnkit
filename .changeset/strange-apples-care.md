---
"@cairnkit/cli": minor
"@cairnkit/core": minor
"@cairnkit/next": minor
"@cairnkit/react": minor
"@cairnkit/ui": minor
---

Fix deep links being ignored when a tour was already running, and no longer restart a deep-linked tour after the user dismisses it. Expose package.json in the exports map so bundler plugins can read it.
