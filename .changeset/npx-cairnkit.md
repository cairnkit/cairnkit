---
"@cairnkit/core": minor
"@cairnkit/react": minor
"@cairnkit/ui": minor
"@cairnkit/next": minor
"@cairnkit/cli": minor
"cairnkit": minor
---

`npx cairnkit init` now works with nothing installed

The command in the docs used to be `npx @cairnkit/cli init`, because the short
version did not work. `npx cairn` fetches an unrelated package of that name and
fails with "could not determine executable to run", and `npx cairnkit` was a
404.

There is now a `cairnkit` package on npm whose only job is to hand over to
`@cairnkit/cli`, so the obvious command does the obvious thing. The CLI also
answers to `cairnkit` directly once installed, alongside the existing `cairn` —
both run the same binary, and nothing that already calls `cairn` changes.

The CLI now calls itself `cairnkit` in its help text, its hints and its results,
rather than printing one name at people who typed another.
