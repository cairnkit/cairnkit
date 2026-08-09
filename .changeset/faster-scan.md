---
"@cairnkit/core": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
"@cairnkit/cli": patch
---

Make `cairn check` roughly five times faster.

Measured on a real 709-file application: 466ms of scanning before, 97ms after.

`stripLiterals` is a character-by-character pass and it ran on every file
twice — once to find the anchor registry, once to find anchor usage. On that
app, 94% of files contain nothing Cairn-related at all, so almost all of that
work went into proving that files with no anchors have no anchors.

Two guards fix it. The registry pass now checks the raw text for
`defineAnchors(` before stripping, which is safe because stripping only ever
removes matches. The usage pass skips any file that mentions neither `cairn`
nor `anchor` nor a registered anchor id.

That last clause matters: config-driven UI passes ids as plain data, and a
field named by the app — `{ tourTarget: "nav.invite" }` — mentions neither
Cairn nor anchors. Dropping it would mark a live anchor unapplied and fail a
build for no reason, so the filter matches registered ids too. There is now a
test for exactly that fixture.
