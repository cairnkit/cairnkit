# @cairnkit/core

[![npm](https://img.shields.io/npm/v/@cairnkit%2Fcore?label=npm&color=4f46e5)](https://www.npmjs.com/package/@cairnkit/core) [![license](https://img.shields.io/npm/l/@cairnkit%2Fcore?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![min+gzip](https://img.shields.io/badge/min%2Bgzip-2.3%20kb-4f46e5)

![An anchor renamed in one file, caught as a type error and then by cairnkit check](https://raw.githubusercontent.com/cairnkit/cairnkit/main/brand/readme/check-fails.gif)

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
  steps: [
    { anchor: anchors.invite.send, title: "Send it", body: "Nothing goes out until you click." },
  ],
});
```

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
