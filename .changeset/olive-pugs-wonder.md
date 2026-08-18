---
"@cairnkit/core": patch
"@cairnkit/cli": patch
---

Match `pauseRoutes`, `handoffRoutes` and `resumeAt` against route patterns, not just exact pathnames.

A dynamic route could not be expressed. `pauseRoutes` was `includes(pathname)`, so covering a detail screen meant enumerating every id it could ever have, which is not possible. Leaving it uncovered is not neutral: `decideForRoute` returns `none`, the tour keeps running onto a page holding none of its anchors, and it ends as `anchor-missing` — which analytics then reports as a broken anchor against a guide that did nothing wrong.

Two forms, on all three fields, because a syntax learned on one and missing on the next is worse than none:

```ts
pauseRoutes: [
  "/settings", // exact, and still the common case
  "/projects/:slug", // :name matches exactly one segment
  "/docs/*", // * matches the rest
];
```

`:name` is one segment on purpose, so `/projects/:slug` does not swallow `/projects/acme/keys` and pause a flow on pages where a different guide takes over. A trailing `*` needs at least one segment, so `/docs/*` does not match `/docs` and pause a flow on the index it launched from.

A pattern with no `:` or `*` short-circuits to string equality, so every flow written before this behaves exactly as it did. `entryRoute` is unchanged and stays concrete: it is the one route cairnkit navigates _to_ rather than tests against.

`cairnkit check`'s `route-conflicts` rule now judges overlap with the same matcher, so pausing `/projects/:slug` while handing off `/projects/acme` is caught rather than passing as two different strings.
