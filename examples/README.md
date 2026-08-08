# Examples

Two working consumers of the workspace packages. Both are real apps rather than
demos — the Vite one doubles as the fixture for the browser audit in CI, so if
a tour breaks there, the build fails.

---

## Before you run anything

```bash
corepack enable     # pnpm 9, as pinned in package.json
pnpm install
pnpm build          # required — examples import the packages' dist output
```

That build step is not optional. The examples resolve `@cairnkit/*` through the
workspace to `dist/`, which does not exist on a fresh clone. Skipping it gives
you `Cannot find module '@cairnkit/core'`, which looks like a broken install
but is not.

---

## The apps

| App                          | Port | Router             |
| ---------------------------- | ---- | ------------------ |
| [`react-vite`](./react-vite) | 4200 | react-router       |
| [`next-app`](./next-app)     | 4100 | Next.js App Router |

```bash
pnpm --filter @cairnkit/example-react-vite dev   # → localhost:4200
pnpm --filter @cairnkit/example-next-app  dev    # → localhost:4100
```

---

## react-vite

A hiring product — pipeline table, question library, compose screen — with two
guides:

- **`invite-candidate`** ends inside a modal, which is the case most tour
  libraries get wrong
- **`write-question`** crosses a route boundary and resumes if you click ahead
  of the guide

Worth trying deliberately, because each exercises behaviour that is hard to
reason about from the source:

1. **Click ahead.** Start the questions guide and press _New Question_ while the
   guide is still on step 2. It catches up rather than dying — `resumeAt`.
2. **Open the modal.** In the invite guide, click _Invite Candidate_ at step 3.
   The overlay portals _into_ the dialog so it survives the focus trap.
3. **Deep link.** Visit `/?tour=invite-candidate` to start a guide from a URL.
4. **Break it.** Delete a `{...anchor(...)}` spread from a page and run
   `pnpm --filter @cairnkit/cli exec cairn check examples/react-vite/src`.

This app is also the proof the engine is not Next-specific: its whole router
integration is [ten lines](./react-vite/src/router-adapter.ts).

### Browser audit

```bash
cd examples/react-vite
pnpm exec playwright install chromium   # first run only
pnpm exec playwright test
```

Drives every step of every flow and fails if any anchor renders nothing. The
dev server starts automatically.

---

## next-app

The same idea against the App Router, with the provider in its own
`"use client"` file so the layout stays a server component. Use this one when
checking SSR behaviour or the `@cairnkit/next` adapters.

---

## Developing a package alongside an example

Run the package watcher in one terminal and the example in another:

```bash
pnpm dev                                          # tsup --watch, all packages
pnpm --filter @cairnkit/example-react-vite dev
```

Without the watcher you are running whatever was in `dist` at the last build,
which is a confusing way to lose ten minutes.
