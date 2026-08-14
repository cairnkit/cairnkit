---
"@cairnkit/cloud": patch
---

Three fixes to the browser transport, all on the path that runs while a page is
closing.

**The documented integration no longer leaks.** `sendToCloud` is meant to be
called inline —

```tsx
<CairnProvider onEvent={sendToCloud({ key })}>
```

— which runs on every render. Each call used to build its own queue, timer and
pair of unload listeners, and nothing removed them, so a re-rendering app
accumulated abandoned queues that all still fired on `pagehide`. There is now
one transport per endpoint+key, so calling it a hundred times is calling it
once. Wrapping in `useMemo` is still tidy but no longer load-bearing. A
`userId` getter passed on a later render is picked up rather than ignored.

**Retries no longer discard the newest events.** When a failed batch came back
and the queue was full, it was truncated from the wrong end — keeping the stale
failed events and dropping the newest arrivals, which are the
`flow_completed` and `flow_dismissed` events every funnel is computed from. It
only happened once sending had been failing long enough to saturate the queue,
which is the moment those events matter most.

**Unload sends the whole queue.** The final flush beaconed only the first 50
events and left the rest in an array that died with the page, so a tab holding
120 queued events sent 50 and lost 70. It now chunks through everything.

**`429` is retried rather than dropped.** Every `4xx` was treated as permanent,
which is right for a revoked key and wrong for a throttle — a project over its
rate limit for one minute would have lost that minute's events instead of
sending them a moment later. `429` now requeues and backs off, honouring the
server's `Retry-After` up to a minute; every other `4xx` is still final and
still reported once through `onError`. The unload path ignores the backoff on
purpose: a closing page has no later.
