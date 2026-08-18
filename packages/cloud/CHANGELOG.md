# @cairnkit/cloud

## 0.12.4

### Patch Changes

- Updated dependencies [c13b012]
  - @cairnkit/core@0.12.4

## 0.12.3

### Patch Changes

- Updated dependencies [264bf96]
  - @cairnkit/core@0.12.3

## 0.12.2

### Patch Changes

- @cairnkit/core@0.12.2

## 0.12.1

### Patch Changes

- @cairnkit/core@0.12.1

## 0.12.0

### Patch Changes

- @cairnkit/core@0.12.0

## 0.11.2

### Patch Changes

- @cairnkit/core@0.11.2

## 0.11.1

### Patch Changes

- 416ae10: Three fixes to the browser transport, all on the path that runs while a page is
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

  - @cairnkit/core@0.11.1

## 0.11.0

### Minor Changes

- 97d9063: `reportFlows` — tell cloud what your tours actually say.

  Events record that step 3 was reached. This records that step 3 says "Set when
  the link expires", so a dashboard can show a tour in the words a reader sees
  instead of ids and indices. That distinction matters to the people who decide
  what a tour should say, and who cannot act on `invite-candidate step 3`.

  ```ts
  reportFlows({
    key: process.env.NEXT_PUBLIC_CAIRNKIT_KEY!,
    flows: flows.map((flow) => ({
      flowId: flow.id,
      version: flow.version,
      steps: flow.steps.map((step, index) => ({
        index,
        anchor: step.anchor,
        title: t(step.titleKey),
        body: t(step.bodyKey),
      })),
    })),
  });
  ```

  It takes copy you have **already resolved**, because only you can resolve it: an
  app that keys its strings through an i18n layer has `steps.expiration.title` in
  the flow definition and the sentence only at render time. Anything reading the
  definitions directly — including a build step — would upload keys, not English.

  Safe to call on every mount. It deduplicates per session against a digest of the
  content, so a page that renders fifty times sends one request, and sends again
  only when the copy has genuinely changed — including on a locale switch, which a
  simple "already sent" flag would miss.

  Reporting is best-effort and never throws: the numbers work without it.

### Patch Changes

- @cairnkit/core@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [14684e5]
  - @cairnkit/core@0.10.0

## 0.9.0

### Minor Changes

- 83f0630: Tell a restart apart from a first attempt, and a returning person from a new one.

  **Run ids.** The transport mints an id when a flow starts and carries it on
  every event until that flow ends, so a session that gives up at step 5 and then
  starts again is two runs rather than one confused sequence. Counted per session
  those two attempts collapsed into a single row and the retry was invisible —
  which mattered, because going back for a second go is usually a sign the first
  one did not work.

  **`userId`.** Optional, and off unless you pass it. cairnkit runs inside an app
  where the person is already signed in, so rather than planting a durable
  identifier on their device we take the id you already hold. Without it the
  session id expires after 30 minutes of inactivity and one person across two
  days is indistinguishable from two people.

  Pass a **function** if someone can sign in while the page is open — the handler
  is usually built once when the provider mounts, so a plain string read at that
  moment stays whatever it was:

  ```ts
  sendToCloud({ key, userId: () => auth.user?.id });
  ```

  This is the one field that is personal data. Send an id you already store,
  never an email address, and only if you mean to.

  **Fixed:** `process.env.NODE_ENV` was read bare in the error path, which every
  bundler replaces at build time and which therefore threw `process is not
defined` only when the package was loaded straight from a CDN as an ES module.
  It is now reached through `globalThis` and is inert where `process` is absent.

### Patch Changes

- @cairnkit/core@0.9.0

## 0.8.0

### Minor Changes

- b07d183: New package: `@cairnkit/cloud`, the browser transport for cairnkit cloud.

  `sendToCloud({ key })` returns a `CairnEventHandler`, so pointing an app at
  cloud is one prop on `CairnProvider`. It owns the parts that are easy to get
  subtly wrong: a session id so completions can be matched to the starts they
  followed, the viewport read at the moment of each event rather than at flush
  time, batching with an immediate flush for `flow_completed` and
  `flow_dismissed`, `sendBeacon` on unload, and a stable per-event id that makes
  a retried batch idempotent instead of double-counted.

  The key is publishable by design — it can write events to one project and read
  nothing — so it belongs in the client bundle.

### Patch Changes

- @cairnkit/core@0.8.0
