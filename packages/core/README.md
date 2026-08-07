# @cairnkit/core

Framework-free engine for in-app product tours that fail the build instead of
the user. **Zero runtime dependencies.**

```bash
npm i @cairnkit/core
```

Most people want [`@cairnkit/react`](https://www.npmjs.com/package/@cairnkit/react)
and [`@cairnkit/ui`](https://www.npmjs.com/package/@cairnkit/ui) instead — this
package is the engine they are built on.

## What is in here

- **Anchors** — a typed registry, the `anchor()` prop spreader, and resolution
  that prefers visible matches so one id works across breakpoints
- **Flows** — step definitions, five advance rules, and the resume / pause /
  handoff lifecycle for when users wander off the guided path
- **Engine** — an observable store and the route decision logic
- **Events** — a typed analytics schema

```ts
import { anchor, defineAnchors, defineFlow } from "@cairnkit/core";

export const anchors = defineAnchors({
  invite: { send: "invite.send" },
});

export const flow = defineFlow({
  id: "invite-candidate",
  version: 1,
  entryRoute: "/pipeline",
  steps: [{ anchor: anchors.invite.send, title: "Send it", body: "Nothing goes out until you click." }],
});
```

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
