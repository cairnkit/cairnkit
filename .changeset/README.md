# Changesets

Every user-facing change needs one:

```bash
pnpm changeset
```

Pick the packages, pick the bump, write a line a consumer would understand.
That line becomes the changelog entry, the GitHub release note, and the
`/changelog` page — so write it for them, not for us.

**Every** published package is **fixed** to one version, so
`@cairnkit/react@0.3.0` always pairs with `@cairnkit/core@0.3.0`. One number to
communicate rather than seven.

Written as "every" rather than a count on purpose: this said "five" for two
releases after `@cairnkit/cloud` and the `cairnkit` shim joined the `fixed`
list in `config.json`, which is the file that actually decides. A number here
is a second source of truth that nobody remembers to update.
