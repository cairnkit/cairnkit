# @cairnkit/cloud

[![npm](https://img.shields.io/npm/v/@cairnkit%2Fcloud?label=npm&color=4f46e5)](https://www.npmjs.com/package/@cairnkit/cloud) [![license](https://img.shields.io/npm/l/@cairnkit%2Fcloud?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![min+gzip](https://img.shields.io/badge/min%2Bgzip-1.7%20kb-4f46e5)

Send cairnkit tour events to [cairnkit cloud](https://cloud.cairnkit.dev).

```bash
npm i @cairnkit/cloud
```

```tsx
import { CairnProvider } from "@cairnkit/react";
import { sendToCloud } from "@cairnkit/cloud";

<CairnProvider flows={flows} onEvent={sendToCloud({ key: process.env.NEXT_PUBLIC_CAIRNKIT_KEY! })}>
  {children}
</CairnProvider>;
```

That is the whole integration. Create a project in cloud, copy its key, and the
tours you already ship start reporting.

## Environment

One variable, and it must be exposed to the browser — the transport runs
client-side.

```bash
# .env.local — from the project screen at https://cloud.cairnkit.dev
NEXT_PUBLIC_CAIRNKIT_KEY=ck_pub_…
```

Next.js inlines `NEXT_PUBLIC_*` at **build** time, so **restart your dev server**
after adding it. A running server has already baked in `undefined`, and the
symptom is silent: tours work, nothing reports, no error anywhere.

Leave it unset and `sendToCloud` is simply not called — tours behave exactly as
before, with no failed requests in a contributor's console.

## Showing the tours in plain language

Events record that step 3 was reached. `reportFlows` records that step 3 _says_
"Set when the link expires", so cloud can show a tour in the words a reader
sees instead of ids and indices — which is what makes it reviewable by whoever
writes the copy.

```tsx
useEffect(() => {
  reportFlows({
    key: process.env.NEXT_PUBLIC_CAIRNKIT_KEY!,
    locale,
    flows: flows.map((flow) => ({
      flowId: flow.id,
      version: flow.version,
      steps: flow.steps.map((step, index) => ({
        index,
        anchor: step.anchor,
        // Resolved by *you*, because only you can resolve it.
        title: step.titleKey ? t(step.titleKey) : (step.title ?? ""),
        body: step.bodyKey ? t(step.bodyKey) : (step.body ?? ""),
      })),
    })),
  });
}, [locale, t]);
```

Call it on mount, not when a tour starts: the copy should be reviewable whether
or not anybody took the guide today. It deduplicates per session against a
digest of the content, so repeated renders send one request and a change of
copy or locale sends another.

Cloud keys each report by flow, version, locale **and a hash of the wording** —
so editing copy without bumping the version keeps both versions rather than
overwriting the old one, and a funnel is never shown beside words its sessions
never saw.

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

| Field       | Why                                                                |
| ----------- | ------------------------------------------------------------------ |
| `sessionId` | So a start can be matched to the completion that followed it       |
| `viewport`  | Read at the moment of the event, so a rotation is not averaged out |
| `props`     | Whatever the SDK emitted: flow id, step index, anchor, path        |

Plus a `runId` per pass through a tour, so starting the same tour twice is two
runs rather than one confused sequence.

`anchor_missing` carries one field worth knowing about if you count these
yourself. A step marked `optional` points at something that legitimately may not
be there, and its absence is reported with `props.optional === true`. Treat those
as breakage and every intended skip becomes a broken anchor in your numbers. The
flag is absent, never `false`, on a required step, so filtering on a truthy value
leaves older events counting as they always did.

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
  after the page is gone, and it sends the **whole** queue in chunks rather than
  one batch
- every event carries an id chosen before its first send, so a retry is ignored
  by the server rather than counted twice
- failed batches are requeued; a permanent rejection (revoked key, bad payload)
  is not retried and is reported once
- **`429` is retried**, not treated as permanent, and the server's `Retry-After`
  is honoured up to a minute. Being throttled must never cost you the events
- when the queue overflows, the **oldest** events are dropped — a completion that
  just happened outranks a step view from four minutes ago

## Calling it more than once

`sendToCloud` returns the same transport for the same key, so this is fine:

```tsx
<CairnProvider onEvent={sendToCloud({ key })}>
```

even though it runs on every render. One queue, one timer, one pair of unload
listeners, however many times you call it. Wrapping in `useMemo` is still tidy
and still cheaper, but nothing breaks without it.

If you pass `userId` as a function, the most recent one wins — so somebody
signing in mid-visit is picked up rather than recorded as anonymous forever.

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
POST { key, sessionId, userId?, events: [{ id, name, at, viewport: { w, h }, runId?, props }] }

202 { accepted, duplicates }                              stored
400 { error: "invalid_payload", issues: string[] }
401 { error: "invalid_key" }                              not retried
413 { error: "payload_too_large" }
429 { error: "rate_limited", scope: "minute" | "month" }  retried, honours Retry-After
```

Sent as `text/plain` to skip the CORS preflight, so your handler must read the
body as text and parse it rather than relying on the content type.

Anything you return other than `429` and `5xx` is taken as final and the batch is
dropped, so a receiver that answers `400` for a transient problem loses events.
Return `429` with a `Retry-After` in seconds when you want the client to back off.

### Limits on cairnkit cloud

| Limit               | Value                 | On breach                                |
| ------------------- | --------------------- | ---------------------------------------- |
| Events per request  | 50                    | `400` — the SDK already chunks to this   |
| Body size           | 64 KB                 | `413`                                    |
| Requests per minute | 600 per project       | `429`, `scope: "minute"` — retry shortly |
| Events per month    | per plan, per project | `429`, `scope: "month"` — retrying fails |

The monthly figure counts events actually **stored**, so a deduplicated retry
does not spend it twice and a refused batch does not spend it at all.

## License

MIT
