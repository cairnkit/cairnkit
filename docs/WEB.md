# Web presence — plan

Two properties, two audiences, two repos. Keeping them separate matters more
than it looks: one is a public developer artifact, the other is a paid product
with customer data behind it.

| Property                | Repo             | Audience              | Public? |
| ----------------------- | ---------------- | --------------------- | ------- |
| `cairnkit.dev`          | `cairnkit`       | developers evaluating | yes     |
| `app.cairnkit.dev`      | `cairnkit-cloud` | paying customers      | no      |

Everything in the "dev-focused landing page" brief belongs to **`cairnkit.dev`**.
None of it belongs to the cloud — a dashboard behind auth has no install
snippet and no bundle badge.

---

## Where the site lives

`apps/web` **inside the `cairnkit` monorepo**, not a separate repo.

The reason is specific and it is the strongest idea in this plan: if the docs
site consumes the workspace packages, **the documentation can run real tours on
itself.** A visitor lands on the docs and takes a Cairn tour *of the docs*.
That is a demo no screenshot or video competes with, and it stays correct
automatically because it imports the same code it documents.

A separate repo would need a published version to demo against, which means the
demo lags the docs.

> The repo being private today does not block this — Vercel and Cloudflare
> Pages both deploy from private repos.

---

## Stack

**Next.js + Fumadocs** (or Nextra). Not VitePress, despite Lucide using it.

VitePress is Vue-based, so a React SDK cannot render live components inside its
MDX. For us that forfeits the entire advantage above. Next-based docs let an
MDX page mount `<CairnProvider>` and run an actual tour inline.

---

## The landing page

Ordered by what a developer actually scans:

**1. Hero.** The one-liner — *"In-app product tours that fail your build, not
your users."* — plus a copy-button install snippet:

```
npm i @cairnkit/core @cairnkit/react @cairnkit/ui
```

**2. The failure, shown not claimed.** A terminal block of real `cairn check`
output. This is the differentiator and it should be above the fold:

```
✗ cairn check failed
  • questions.save is registered but never applied to an element
      breaks "create-questions"  src/walkthrough/flows.ts:35
```

**3. Live playground.** An embedded StackBlitz of `examples/react-vite`, so
someone can click through a real tour — including the modal step — without
installing anything. For a tour library this is worth more than any prose.

**4. Size badges.** We can make this claim honestly, which most cannot:

| Package           | gzipped | runtime deps      |
| ----------------- | ------- | ----------------- |
| `@cairnkit/core`  | 2.7 kb  | **zero**          |
| `@cairnkit/react` | 3.1 kb  | core only         |
| `@cairnkit/ui`    | 6.7 kb  | `@floating-ui/dom` |
| `@cairnkit/next`  | 0.3 kb  | react only        |

**5. Comparison — but not the one in the brief.**

The brief suggests performance benchmarks against legacy packages. I would not
do that. Cairn is not faster than driver.js, and claiming a speed advantage
invites a rebuttal on the one axis we do not win.

Compare on the axis we actually own — **what happens when the UI changes**:

| | driver.js | Shepherd | Pendo | Cairn |
| --- | --- | --- | --- | --- |
| Targeting | CSS selector | CSS selector | visual picker | typed anchor |
| Rename a class | silently breaks | silently breaks | silently breaks | won't compile |
| Delete the element | silently breaks | silently breaks | silently breaks | **fails CI** |
| Element stops rendering | silently breaks | silently breaks | silently breaks | fails the audit |

That table is honest, verifiable, and unanswerable — because the alternatives
genuinely cannot do it without a repo.

---

## Docs structure

```
/                     landing
/docs/getting-started
/docs/anchors         the registry, and why not CSS selectors
/docs/flows           steps and the five advance rules
/docs/off-path        resumeAt · pauseRoutes · handoffRoutes
/docs/modals          anchoring inside dialogs
/docs/theming         → docs/THEMING.md
/docs/ci              cairn check + the Playwright audit
/docs/api             generated from the .d.ts
/playground           the live example
/changelog            generated, see below
```

Each concept page should end with a **live tour of itself** rather than a
screenshot.

---

## Changelog and releases

Use **Changesets**, already planned in `STRUCTURE.md`. It gives three surfaces
from one source of truth:

1. `CHANGELOG.md` per package, written by the tool
2. GitHub Releases, published by the changesets action
3. `/changelog` on the site, reading those markdown files at build time

Fixed versioning across packages, so `@cairnkit/react@0.3.0` always pairs with
`@cairnkit/core@0.3.0` — one version number to communicate rather than five.

---

## SEO and metadata

- `SoftwareApplication` + `SoftwareSourceCode` JSON-LD on the landing page
- `TechArticle` per docs page
- OG images per page — generate with `next/og` so code snippets render as images
- Canonical URLs, sitemap, `robots.txt`
- The favicon set in `brand/` is already the right sizes

---

## Sequencing

The site is only worth building once the packages are published, because every
install snippet is a lie until then. Order:

1. Integrate one real app → settle the API
2. Publish `0.1.0`
3. Landing + getting-started + playground — enough to evaluate
4. Fill out the concept docs
5. Cloud dashboard

Steps 3 and 4 are also when the SDK's rough edges surface: writing "getting
started" is the fastest way to discover that an API is awkward.
