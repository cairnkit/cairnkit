# Changesets

Every user-facing change needs one:

```bash
pnpm changeset
```

Pick the packages, pick the bump, write a line a consumer would understand.
That line becomes the changelog entry, the GitHub release note, and the
`/changelog` page — so write it for them, not for us.

All five published packages are **fixed** to one version, so
`@cairnkit/react@0.3.0` always pairs with `@cairnkit/core@0.3.0`. One number to
communicate rather than five.
