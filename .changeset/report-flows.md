---
"@cairnkit/cloud": minor
---

`reportFlows` — tell cloud what your tours actually say.

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
