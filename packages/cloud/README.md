# @cairnkit/cloud

Send cairnkit tour events to [cairnkit cloud](https://cloud.cairnkit.dev).

```bash
npm i @cairnkit/cloud
```

```tsx
import { CairnProvider } from "@cairnkit/react";
import { sendToCloud } from "@cairnkit/cloud";

<CairnProvider
  flows={flows}
  onEvent={sendToCloud({ key: process.env.NEXT_PUBLIC_CAIRNKIT_KEY! })}
>
  {children}
</CairnProvider>;
```

That is the whole integration. Create a project in cloud, copy its key, and the
tours you already ship start reporting.

## The key is publishable

It ships in your JavaScript bundle and your users can read it. That is fine and
intended: the key can write events to one project and can read nothing at all —
not your events, not your account, not another project. Put it in
`NEXT_PUBLIC_*` or the equivalent without ceremony.

If a key ends up somewhere it should not be, revoke it in cloud. Revoking takes
effect on the next batch, not on your next deploy.

## What it sends

One event per tour signal — `flow_started`, `step_viewed`, `flow_completed`,
`flow_dismissed`, `anchor_missing`, `flow_handoff`, `step_feedback` — each with:

| Field       | Why                                                          |
| ----------- | ------------------------------------------------------------ |
| `sessionId` | So a start can be matched to the completion that followed it  |
| `viewport`  | Read at the moment of the event, so a rotation is not averaged out |
| `props`     | Whatever the SDK emitted: flow id, step index, anchor, path   |

The session id is opaque, random, and kept in `localStorage` for 30 minutes of
inactivity. It is not a cookie, not a user id, and never joined to one — cairnkit
measures whether a tour worked, which needs no idea who took it.

Nothing else is collected. No user agent, no IP-derived location, no page
content, no cross-site anything.

## Reliability

Tours end at exactly the moment people navigate away, which is the hardest
moment to record. So:

- events are batched for a second, and **terminal events flush immediately** —
  a completion never waits
- the unload path uses `sendBeacon`, the only transport a browser will still run
  after the page is gone
- every event carries an id chosen before its first send, so a retry is ignored
  by the server rather than counted twice
- failed batches are requeued; a permanent rejection (revoked key, bad payload)
  is not retried and is reported once

## Options

```ts
sendToCloud({
  key: "ck_pub_…",
  endpoint: "https://cloud.cairnkit.dev/api/events", // self-hosting
  onError: ({ status, body }) => Sentry.captureMessage(`cairnkit: ${status}`),
});
```

`onError` fires only for permanent rejections. Without it, those log a console
warning in development and stay silent in production.

## Self-hosting

`endpoint` accepts any URL that speaks the same shape:

```
POST { key, sessionId, events: [{ id, name, at, viewport: { w, h }, props }] }
→ 202 { accepted, duplicates }
```

Sent as `text/plain` to skip the CORS preflight, so your handler must read the
body as text and parse it rather than relying on the content type.

## License

MIT
