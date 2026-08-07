# Releasing

## One-time setup

1. **npm org** — create `cairnkit` at npmjs.com (free for public packages).
   Use `hello@cairnkit.dev`, not a personal address: the org owns the scope,
   and recovery should belong to the project rather than a person.
2. **Enable 2FA.** npm requires it to publish.
3. **Automation token** — npm → Access Tokens → *Granular*, scoped to the
   `@cairnkit` org, type **Automation** (bypasses the 2FA prompt in CI).
4. **Add it to GitHub** as the `NPM_TOKEN` repository secret.
5. **Make the repo public.** Provenance requires a public repo, and the badge
   is worth having — it cryptographically ties each published tarball to the
   commit and workflow that built it.

## Every change

```bash
pnpm changeset          # pick packages, pick a bump, write the entry
git commit && git push
```

Merging to `main` opens a **Version Packages** PR. Merging *that* publishes.
Nothing reaches npm without two deliberate merges.

## Before the first publish

- [ ] A real app consumes the packages, and the API survived it
- [ ] `cairnkit.dev` resolves — every README links to it
- [ ] Version is `0.1.0`, not `0.0.0`
- [ ] `pnpm pack` output installs into a clean project (see below)
- [ ] `LICENSE` is what you intend it to be, permanently

## Verify the artifact, not the workspace

Every serious bug found so far was invisible from inside the workspace:
`workspace:*` leaking into the tarball, and `resolveAnchor` crashing under SSR.
Check what a consumer actually receives:

```bash
pnpm build
cd packages/react && pnpm pack --pack-destination /tmp/dist

cd /tmp && mkdir consumer && cd consumer && npm init -y
npm i react react-dom /tmp/dist/cairnkit-react-0.1.0.tgz
node -e "import('@cairnkit/react').then(m => console.log(Object.keys(m)))"
```

**Use `pnpm pack` and `pnpm publish`, never the npm equivalents.** npm leaves
`workspace:*` in the manifest and the package becomes uninstallable outside
this repo — with a `EUNSUPPORTEDPROTOCOL` error that gives no hint why.

## Versioning

All five packages are **fixed** to one version, so `@cairnkit/react@0.3.0`
always pairs with `@cairnkit/core@0.3.0`.

Stay on `0.x` until a real app has run in production for a while. `0.x` sets
the expectation that things may move; `1.0` is a promise, and it is much easier
to make it late than to break it early.

## If you publish something wrong

You have **72 hours** to `npm unpublish`. After that the version is permanent
and the only remedy is `npm deprecate` plus a new version. This is the reason
not to publish an API you are still changing.
