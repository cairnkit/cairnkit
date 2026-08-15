# cairnkit

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
