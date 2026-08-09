---
"@cairnkit/core": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
"@cairnkit/cli": patch
---

Warn when `start()` is given a flow the provider does not know.

It returned silently, so a launcher wired to a missing flow id did nothing at
all and said nothing about why. Found by building the docs playground, where a
second provider legitimately does not know the first one's flows — the launcher
rendered, clicked, and no tour started.

The warning names the flow and lists what the provider does know. It uses
`devWarn`, so it costs nothing in production builds. `devWarn` is now exported
from `@cairnkit/core` for the same reason.
