# cairnkit

## 0.12.4

### Patch Changes

- Updated dependencies [c13b012]
  - @cairnkit/cli@0.12.4

## 0.12.3

### Patch Changes

- @cairnkit/cli@0.12.3

## 0.12.2

### Patch Changes

- @cairnkit/cli@0.12.2

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

- Updated dependencies [690a711]
  - @cairnkit/cli@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [34e5937]
  - @cairnkit/cli@0.12.0

## 0.11.2

### Patch Changes

- Updated dependencies [5109388]
  - @cairnkit/cli@0.11.2

## 0.11.1

### Patch Changes

- @cairnkit/cli@0.11.1

## 0.11.0

### Patch Changes

- @cairnkit/cli@0.11.0

## 0.10.0

### Patch Changes

- @cairnkit/cli@0.10.0

## 0.9.0

### Patch Changes

- @cairnkit/cli@0.9.0

## 0.8.0

### Patch Changes

- @cairnkit/cli@0.8.0

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
  - @cairnkit/cli@0.7.0
