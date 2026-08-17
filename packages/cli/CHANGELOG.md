# @cairnkit/cli

## 0.12.2

### Patch Changes

- @cairnkit/core@0.12.2

## 0.12.1

### Patch Changes

- 690a711: Correct the CLI's npm description, fill in missing package metadata, and expand two thin READMEs.

  No code changed. All of this ships inside the published tarball, which is why it
  needs a release to reach anyone.

  **`@cairnkit/cli`'s description said `cairn check`.** The CLI has always printed
  `cairnkit check`, and the docs were aligned on that in the previous release, but
  the npm description was missed. It is the single most visible surface there is:
  the package page, search results, and every registry dashboard. Fixed.

  **`cairnkit` and `@cairnkit/ui` had no `bugs` field** and five keywords where the
  other five packages carry thirteen. `cairnkit` was also writing its keywords with
  spaces, so `"product tour"` never matched a search for `product-tour`. Both now
  match the rest.

  **Two READMEs were thin enough to be unhelpful.** `@cairnkit/next` documented two
  of its three exports, leaving `appRouterAdapter` unmentioned, and said nothing
  about why the package exists at all. `cairnkit` did not explain what `init`
  produces, or that `npx cairn` fetches an unrelated package of that name while
  `npx cairnkit` resolves to this one.

  Also corrects the install page, which said `init` prints "the two steps it
  deliberately leaves to you". It prints three, and it writes into
  `src/walkthrough/` rather than the `app/` paths used by the manual instructions
  further down the page.

  - @cairnkit/core@0.12.1

## 0.12.0

### Minor Changes

- 34e5937: Add `cairn status`, `--json` on both commands, and fix flows in one file being merged into one.

  ## `--json`

  `check` and the new `status` command both take `--json`. In that mode stdout
  carries exactly one JSON object and every human-facing message goes to stderr,
  so the output can be piped straight into a parser.

  ```
  npx cairnkit status --json
  npx cairnkit check --json
  ```

  The payload carries a `version` field, because it is a contract the moment
  anything consumes it and a consumer needs to tell an old shape from a new one
  without guessing from which keys happen to be present.

  ## `cairn status`

  Answers "what is there", where `check` answers "is anything wrong": every
  anchor, whether an element carries it, whether it got there through the typed
  spread or a bare `data-cairn` attribute, where it was declared, and which flows
  point at it. Always exits 0, because describing a project is not a verdict on
  it.

  This exists mainly for tooling. An agent asked to add a tour needs the current
  anchor graph before it can write a sensible one, and that graph is not
  derivable by grepping: it needs the registry path resolution and the rule that
  flow files reference anchors rather than apply them. CI annotations and editor
  integrations want the same shape, so it lives in the CLI rather than behind a
  separate integration.

  ## Flows in one file were merged into one

  Found while building the above. The scanner parsed flows per _file_: it took the
  first `id:` it found and attributed every anchor, pause route and handoff in
  that file to it. A file holding four `defineFlow` calls reported one flow owning
  all of them.

  The visible symptom was `check` naming the wrong flow. Given two flows in one
  file, an anchor used only by the second was reported as breaking the first:

  ```
  - b.two  (breaks "first-flow")     ← before, wrong
  - b.two  (breaks "second-flow")    ← after
  ```

  Route config leaked the same way, so one flow's `pauseRoutes` were attributed to
  another and `route-conflicts` was reasoning about the wrong pairs.

  The scanner now cuts the file into one segment per `defineFlow(` and parses each
  on its own. Segments are found in the stripped copy so a call quoted inside a
  docs snippet does not start a phantom flow, and step offsets are translated back
  to file coordinates so findings still point at the step rather than the top of
  the file.

  ## Docs realigned

  Every doc, README and page that mentions the CLI now says `cairnkit`, and the
  sample failure output matches what the tool actually prints.

  Seven places showed `✗ cairn check failed`. The tool has always printed
  `✗ cairnkit check failed`, deliberately, because `cairnkit` is the only name
  that also works as `npx cairnkit` from a directory with nothing installed.

  That distinction is not cosmetic. `cairn` is a real bin alias and works once the
  package is installed, but `npx cairn` fetches an unrelated package of that name
  from the registry and runs it. One canonical spelling everywhere removes the
  chance of a reader copying the form that only works by accident.

  ## `init` names the Vite entry where it actually is

  The Next branches resolve the file to edit from the detected framework
  directory, so they already said `app/layout.tsx` or `src/pages/_app.tsx`
  correctly. The Vite branch named `src/main.tsx` unconditionally.

  `create-vite` does put the entry under `src/`, so the assumption held nearly
  always and failed silently the rest of the time: the instruction pointed at a
  file the reader did not have. It now follows `usesSrcDir`, which is already how
  the generated files choose their own home.

### Patch Changes

- @cairnkit/core@0.12.0

## 0.11.2

### Patch Changes

- 5109388: Report the anchor id when a `data-cairn` attribute is not in the registry, and stop reporting registered ones.

  `cairn check` scans a stripped copy of each file, where comments and string
  contents are replaced with same-length padding so that a `defineAnchors({...})`
  quoted inside a docs snippet cannot register phantom anchors.

  A JSX attribute value is a string literal, so the `data-cairn="..."` scan was
  reading that padding rather than the id. Two consequences, both on the raw
  attribute path only:

  - **Every** `data-cairn` attribute was reported as "not in the registry", even
    when it was registered, because the value being looked up was a run of spaces.
  - The finding could not name the offending value, so the report read
    `- ␣␣␣␣␣ src/components/help.tsx:2` with a blank where the id should be.

  The scan now reads the value from the original source and skips any match whose
  offset no longer begins with `data-cairn=` in the stripped copy. That guard is
  what preserves the original protection: a comment or template literal is blanked
  wholesale, attribute name included, so a documented example still does not count
  as a real use, while a genuine attribute keeps its name because only the quoted
  value is padded.

  Applying anchors the documented way, `{...anchor(anchors.group.key)}`, was never
  affected: those are matched as identifiers rather than as strings.

  - @cairnkit/core@0.11.2

## 0.11.1

### Patch Changes

- @cairnkit/core@0.11.1

## 0.11.0

### Patch Changes

- @cairnkit/core@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [14684e5]
  - @cairnkit/core@0.10.0

## 0.9.0

### Patch Changes

- @cairnkit/core@0.9.0

## 0.8.0

### Patch Changes

- @cairnkit/core@0.8.0

## 0.7.0

### Minor Changes

- 1ee2cdc: npx cairnkit as the cold-start command
- 1ee2cdc: `npx cairnkit init` now works with nothing installed

  The command in the docs used to be `npx @cairnkit/cli init`, because the short
  version did not work. `npx cairn` fetches an unrelated package of that name and
  fails with "could not determine executable to run", and `npx cairnkit` was a 404.

  There is now a `cairnkit` package on npm whose only job is to hand over to
  `@cairnkit/cli`, so the obvious command does the obvious thing. The CLI also
  answers to `cairnkit` directly once installed, alongside the existing `cairn` —
  both run the same binary, and nothing that already calls `cairn` changes.

  The CLI now calls itself `cairnkit` in its help text, its hints and its results,
  rather than printing one name at people who typed another.

### Patch Changes

- Updated dependencies [1ee2cdc]
- Updated dependencies [1ee2cdc]
  - @cairnkit/core@0.7.0

## 0.6.0

### Minor Changes

- 3a5bc33: scope, so two guides can share one screen"

### Patch Changes

- Updated dependencies [3a5bc33]
  - @cairnkit/core@0.6.0

## 0.5.3

### Patch Changes

- c3a735c: Stop `cairn check` crashing in projects without a `src/` directory.

  `src` was the only default and `readdirSync` throws on a directory that is not
  there, so any project without one — a Next app created with `--no-src-dir`,
  most obviously — got a raw ENOENT stack trace out of `node:fs` instead of an
  answer. Worse, `cairn init` had just scaffolded into `walkthrough/`, so the
  command failed immediately after the command that set it up.

  With no arguments it now looks for `src`, `app`, `pages`, `walkthrough`, `lib`
  and `components`, scans every one it finds, and falls back to the working
  directory when it recognises none. A path that genuinely does not exist is
  reported as a sentence naming it, not a stack trace — which matters for anyone
  reading the output, and rather more for a coding agent trying to act on it.

- Updated dependencies [c3a735c]
  - @cairnkit/core@0.5.3

## 0.5.2

### Patch Changes

- 37b0e6b: Make `cairn init` output readable, and stop it colouring log files.

  The instructions were a flat wall of indented text with no separation between
  what to read and what to type. Steps are now numbered, each names the file it
  applies to, and every command or snippet sits in its own gutter so the eye can
  find it. A left bar rather than a drawn box — boxes have to guess the terminal
  width and wrap badly when they guess wrong.

  Colour is now emitted only when stdout is a TTY, and `NO_COLOR` and
  `TERM=dumb` are honoured. Redirecting the output previously wrote ten escape
  sequences into the file, which is exactly where they are least wanted.

  The steps themselves are structured data on the plan now rather than
  pre-indented strings, so presentation lives in the command and the planner
  stays about content.

- Updated dependencies [37b0e6b]
  - @cairnkit/core@0.5.2

## 0.5.1

### Patch Changes

- ce70800: Warn when `cairn init` regenerates a flow beside anchors it kept.

  The realistic partial case: someone ran `init`, edited their anchor registry,
  then lost or deleted `flows.ts`. Keeping their registry is right — overwriting
  it is never what anyone wants — but the flow it generates points at the example
  ids (`nav.home`, `home.primary-action`) that their edited registry almost
  certainly no longer contains. The result was a compile error the developer did
  not cause and had no obvious way to attribute.

  It now says so, and suggests `--dir` for a clean slate. Nothing else changes:
  files are still never overwritten, and a full rerun is still a no-op.

- Updated dependencies [ce70800]
  - @cairnkit/core@0.5.1

## 0.5.0

### Minor Changes

- 5fbd674: Add `cairn init`.

  ```
  npx @cairnkit/cli init
  ```

  Detects the project and scaffolds anchors, a flow, the typed registry and a
  provider — then tells you the two things it deliberately did not do.

  It reads the framework (Next App Router, Next Pages Router, react-router v6 or
  v7, plain React), whether source lives under `src/`, the tsconfig path alias,
  TypeScript or JavaScript, and the package manager. Detection and planning are
  pure functions over a small reader interface, so the whole matrix is tested
  without touching a filesystem.

  JavaScript projects get JavaScript — no `import type`, no annotations, and no
  type registry, with a note saying plainly that the drift protection is the part
  you lose without TypeScript.

  Things it gets right because we got them wrong first:

  - `@cairnkit/core` is always in the install command. Under pnpm the type
    registry does not compile without it, and npm hoisting hides that.
  - The Next provider is marked `"use client"`.
  - Imports are built from where the alias actually points. `"@/*": ["./*"]` and
    `"@/*": ["./src/*"]` need different specifiers for the same file, and it
    falls back to relative when the files sit outside the alias entirely.
  - react-router v7 moved into the `react-router` package; the adapter follows
    whichever is installed.
  - A router it does not support produces a stub that throws, not `memoryRouter`
    quietly swallowing every route-aware step.
  - It warns when tsconfig `include` would leave the registry inert, which is a
    silent failure that just leaves every id typed as `string`.

  It never overwrites an existing file, never writes outside the project, and
  never edits your layout — a mangled root file is not worth the minute saved.
  `--dry-run` prints the whole plan — files, install command and manual steps —
  and writes nothing. `--dir` chooses where things land.

  `pnpm test:init` runs the generated output through real installs and real
  compilers across eight project shapes, because unit tests prove the plan is
  right and only that proves the files work in someone else's repo.

### Patch Changes

- 5fbd674: Make `cairn check` roughly five times faster.

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

- Updated dependencies [5fbd674]
- Updated dependencies [5fbd674]
  - @cairnkit/core@0.5.0

## 0.4.2

### Patch Changes

- 7c91af9: Fix the spotlight landing in the wrong place inside modals and drawers.

  When a step points at something in a dialog, the overlay portals into that
  dialog so it survives focus traps and `inert`. The tooltip positioned itself
  correctly, but the spotlight ring did not — it highlighted empty space, often
  an element behind the dialog, while the dialog itself sat under an uncut scrim.

  `.cairn-root` is `position: fixed; inset: 0`, so its box is normally the
  viewport and target rects from `getBoundingClientRect` can be used as-is. But
  an ancestor with `transform`, `filter`, `backdrop-filter`, `perspective`,
  `contain` or `will-change` becomes the containing block for fixed descendants.
  The root then shrinks to that element and every coordinate is off by its
  origin. Drawers hit this every time, because sliding one in means transforming
  it.

  The overlay now measures its own root and offsets the spotlight by it, which
  is a no-op when the containing block really is the viewport.

- Updated dependencies [7c91af9]
  - @cairnkit/core@0.4.2

## 0.4.1

### Patch Changes

- 7db5f02: Warn when `start()` is given a flow the provider does not know.

  It returned silently, so a launcher wired to a missing flow id did nothing at
  all and said nothing about why. Found by building the docs playground, where a
  second provider legitimately does not know the first one's flows — the launcher
  rendered, clicked, and no tour started.

  The warning names the flow and lists what the provider does know. It uses
  `devWarn`, so it costs nothing in production builds. `devWarn` is now exported
  from `@cairnkit/core` for the same reason.

- Updated dependencies [7db5f02]
  - @cairnkit/core@0.4.1

## 0.4.0

### Minor Changes

- 6ae8bf4: Add `useTourAction`, and fix an install that never worked under pnpm.

  Both found by integrating the SDK into a real application.

  **Step hooks can now reach component state.** `onEnter` and `onExit` shipped in
  0.3.0 with a worked example that closed a modal by calling `closeSettings()`
  directly. That only compiles if the flow is declared where the setter is in
  scope — which is never, for anyone following the recommended layout, because
  flows are module-level data. The hooks were unusable for the exact case they
  were added for.

  Components now publish named actions, and steps call them:

  ```tsx
  useTourAction("settings:close", () => setOpen(false));
  ```

  ```ts
  onExit: (direction, ctx) => ctx.run("settings:close");
  ```

  Both hooks receive a `StepContext` as their last argument, so existing
  callbacks are unaffected. Action names narrow through `CairnRegister.actions`
  like anchors and events do. The registry is per-provider rather than
  module-level: a module-level map would be shared across requests during server
  rendering and collide between two providers on one page.

  **`@cairnkit/core` is now in the documented install command.** It was missing
  everywhere. npm hoists it as a transitive dependency so nobody noticed, but
  pnpm does not, and `declare module "@cairnkit/core"` — the typed-anchor
  registry, the headline feature — fails to compile without it. `@cairnkit/react`
  additionally re-exports `defineFlow`, `defineAnchors` and `anchor` so authoring
  a flow needs one import instead of two.

  **Sizes are measured, not remembered.** `pnpm size` prints gzipped sizes and
  `pnpm size:check` fails CI when the landing page disagrees. Correcting the
  hand-written numbers: core 2.7 kb, react 3.1 kb, ui 6.7 kb, headless 6.1 kb.
  "Everything" was overstated at 18.8 kb and actually costs 16.6 kb.

### Patch Changes

- Updated dependencies [6ae8bf4]
  - @cairnkit/core@0.4.0

## 0.3.0

### Minor Changes

- bbd9dcb: Add `onEnter` and `onExit` step hooks, and fix two `cairn check` blind spots.

  Found by integrating the SDK into a real application rather than an example.

  **Step lifecycle hooks.** A step anchored inside a modal left the tour stranded:
  the next step's target sits behind the dialog, so Next moved the spotlight onto
  something the user could not reach. Steps now take `onEnter` and
  `onExit(direction)`. `onExit` is awaited before the next step measures, so an
  animated close finishes first instead of being measured mid-transition. Hooks
  that throw are logged and the tour continues — a broken hook must not strand
  anyone mid-flow.

  `advance()` and `back()` keep their `() => void` signatures; the move is
  deferred internally rather than handed to the caller as a promise.

  **`cairn check` accepts multiple paths.** `cairn check src app` scanned only
  `src` and silently reported success for anchors it never looked at.

  **`cairn check` sees config-driven anchors.** Anchors passed as data — through a
  prop, or a config object, rather than written inline as JSX — read as unused,
  so deleting a live anchor still passed. The scanner now matches registered
  anchor strings anywhere outside the registry itself.

### Patch Changes

- Updated dependencies [bbd9dcb]
  - @cairnkit/core@0.3.0

## 0.2.3

### Patch Changes

- c0a7343: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight.
- a99bce5: Fix the tooltip landing at the viewport origin when a step points inside a dialog, and stop the tooltip arrow overlapping the spotlight. The arrow is now slightly larger, and its distance from the target scales with the step's padding.
- Updated dependencies [c0a7343]
- Updated dependencies [a99bce5]
  - @cairnkit/core@0.2.3

## 0.2.2

### Patch Changes

- eaa3de3: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
- Updated dependencies [eaa3de3]
  - @cairnkit/core@0.2.2

## 0.2.1

### Patch Changes

- e2f712d: Read the target's border-radius once per step instead of on every animation frame, halving the cost of the rect-tracking hot path.
- Updated dependencies [e2f712d]
  - @cairnkit/core@0.2.1

## 0.2.0

### Minor Changes

- 5f4459d: Fix deep links being ignored when a tour was already running, and no longer restart a deep-linked tour after the user dismisses it. Expose package.json in the exports map so bundler plugins can read it.

### Patch Changes

- Updated dependencies [5f4459d]
  - @cairnkit/core@0.2.0

## 0.1.0

### Minor Changes

- 92ff83c: First release. Typed anchors, five advance rules, resume/handoff/pause for users who go off-script, an overlay that works inside modals, and cairn check to fail CI when a tour points at UI that no longer exists.

### Patch Changes

- Updated dependencies [92ff83c]
  - @cairnkit/core@0.1.0
