# Contributing

Thanks for taking a look. Bug reports and small fixes are always welcome; for
anything larger, please open an issue first so we can agree the shape before you
spend time on it.

---

## Setup

**pnpm is required**, not npm or yarn. A `preinstall` guard will stop you if
you forget, but the reason matters: the workspace uses the `workspace:*`
protocol, which npm cannot resolve — and `npm pack` silently leaves it in the
published manifest, producing packages that install nowhere.

The easiest way to get the right version:

```bash
corepack enable          # uses the pnpm version pinned in package.json
```

```bash
git clone https://github.com/cairnkit/cairnkit.git
cd cairnkit
pnpm install
pnpm build
```

Node 18+ and **pnpm 9**. The version comes from `packageManager` in
`package.json`, so don't also pass `--version` to a setup action — two sources
disagreeing makes the install abort. An older pnpm will fail to read the v9
lockfile, which surfaces as a confusing install error rather than a version
warning.

---

## The commands

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `pnpm build`     | Builds all five packages           |
| `pnpm dev`       | `tsup --watch` across packages     |
| `pnpm test`      | Unit tests (vitest)                |
| `pnpm typecheck` | Typechecks every package           |
| `pnpm format`    | Prettier                           |
| `pnpm changeset` | Records a release note — see below |

Running the examples and the browser audit is covered in
[examples/README.md](./examples/README.md).

---

## Repository layout

```
packages/core     engine — anchors, flows, advance rules. Zero runtime deps.
packages/react    headless hooks and provider. No styling.
packages/ui       prebuilt overlay. Plain prefixed CSS.
packages/next     Next.js router adapters.
packages/cli      cairn check, and the browser audit helper.
examples/         real consumers, and the audit fixture.
apps/web          cairnkit.dev — landing page and docs.
```

Dependencies point inward: `cli → core`, `ui → react → core`. Never the
reverse. See [docs/STRUCTURE.md](./docs/STRUCTURE.md) for the rules and the
reasoning behind what is deliberately _not_ a dependency.

**`core` must keep zero runtime dependencies.** It is what everything else
builds on, and being cheap to adopt is a feature. A PR adding one to `core`
needs a strong argument.

---

## Before you open a PR

```bash
pnpm build && pnpm typecheck && pnpm test
node packages/cli/dist/bin.js check examples/react-vite/src
cd examples/react-vite && pnpm exec playwright test
```

CI runs the same set, plus `pnpm audit --prod --audit-level high`.

### Changesets

Every user-facing change needs one:

```bash
pnpm changeset
```

Press Enter past **major** and **minor**, and select packages at **patch** for a
bug fix. All five packages are version-locked, so they bump together.

While the project is on `0.x`, a **breaking change is a minor bump**, not a
major — `1.0.0` is reserved for the point where the API stops moving.

Write the summary for a stranger reading a changelog. Say what was broken, not
which function you edited.

### Sandboxes are regenerated after a release, not before

`sandboxes/` is generated from `examples/` with the workspace version pinned,
and the generator checks that version is on npm — but it cannot check that the
version actually _has_ the API the examples use. So any change that adds an
export and then uses it in an example must be regenerated **after** publishing:

1. Merge the change. `pnpm sandboxes:check` fails on `main` until step 3, and
   that failure is correct: the sandboxes really are out of date.
2. Merge the Version Packages PR, which publishes.
3. `pnpm sandboxes && pnpm sandboxes:verify`, then commit the result.

Regenerating at step 1 pins the sandbox to the _previous_ version while its
source imports something that version does not export. It installs cleanly and
then fails in the browser, where it looks like the library is broken.

---

## Testing philosophy

Three layers, and each catches something the others cannot:

- **Unit** — pure logic only: `resume.ts`, `lifecycle.ts`, the scanner. jsdom
  has no layout engine, so positioning and spotlight geometry cannot be
  meaningfully tested there.
- **Browser audit** — anything involving layout, scroll, portals or routing.
- **A real consumer** — install the packed tarball into a scratch project.

That last one is not ceremony. Every serious bug found so far was invisible from
inside the workspace: `workspace:*` leaking into tarballs, `resolveAnchor`
throwing during SSR, four copies of React from symlinks. If you change anything
about packaging or exports, verify the artifact:

```bash
cd packages/core && pnpm pack --pack-destination /tmp/dist
cd /tmp && mkdir consumer && cd consumer && npm init -y
npm i /tmp/dist/cairnkit-core-*.tgz
```

---

## Style

- One primary export per file, named after the file
- Around 150 lines per file; past that it is doing two jobs
- Comments explain _why_, not what. Especially for anything that looks odd —
  most of the strange-looking code here is load-bearing.
- Prettier decides formatting. Don't argue with it, just run `pnpm format`.

---

## Reporting a bug

The most useful report includes the flow definition, the anchor involved, and
whether `cairn check` passes. If it passes but the tour still breaks, that is a
gap in the check itself, which is worth knowing about.

For security issues, see [SECURITY.md](./SECURITY.md) — please don't open a
public issue.
