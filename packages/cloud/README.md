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

Plus a `runId` per pass through a tour, so starting the same tour twice is two
runs rather than one confused sequence.

The session id is opaque, random, and kept in `localStorage` for 30 minutes of
inactivity. It is not a cookie and not a user id.

Nothing else is collected by default. No user agent, no IP-derived location, no
page content, no cross-site anything.

## Knowing it is the same person

Sessions expire after 30 minutes idle, so one person across two days looks like
two people. If you need to tell them apart, hand us the id you already have:

```ts
sendToCloud({ key, userId: () => auth.user?.id });
```

Pass a **function** if someone can sign in while the page is open — the handler
is usually built once when your provider mounts, so a plain string read at that
moment stays whatever it was then.

This is the one field that is personal data, which is why it is off unless you
pass it and why cairnkit does not invent its own durable device id instead.
Send an id you already store, never an email address. Deleting a project
deletes them with it.

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
