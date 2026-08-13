# @cairnkit/cloud

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
