---
"@cairnkit/cloud": minor
---

New package: `@cairnkit/cloud`, the browser transport for cairnkit cloud.

`sendToCloud({ key })` returns a `CairnEventHandler`, so pointing an app at
cloud is one prop on `CairnProvider`. It owns the parts that are easy to get
subtly wrong: a session id so completions can be matched to the starts they
followed, the viewport read at the moment of each event rather than at flush
time, batching with an immediate flush for `flow_completed` and
`flow_dismissed`, `sendBeacon` on unload, and a stable per-event id that makes
a retried batch idempotent instead of double-counted.

The key is publishable by design — it can write events to one project and read
nothing — so it belongs in the client bundle.
