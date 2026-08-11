/**
 * What the CLI calls itself in help text, hints and results.
 *
 * The binary answers to three names — `cairnkit`, `cairn`, and
 * `npx @cairnkit/cli` — and it deliberately reports one of them rather than
 * echoing whichever was typed. Detecting that is not reliable: npm symlinks
 * `.bin/cairn` so `argv[1]` keeps the name, while pnpm writes a shim that
 * resolves to `dist/bin.js` and loses it. A hint that changes with the package
 * manager is worse than one that is simply always right.
 *
 * `cairnkit` is the one to print, because it is the only name that also works
 * as `npx cairnkit` from a directory with nothing installed.
 */
export const CLI_NAME = "cairnkit";
