#!/usr/bin/env node
/**
 * The unscoped name, so the first command anyone runs needs nothing installed:
 *
 *   npx cairnkit init
 *
 * `npx <name>` fetches the *package* called <name> and runs its bin. Without
 * this package that command is a 404, and `npx cairn` is worse — it fetches an
 * unrelated package of that name and fails with "could not determine
 * executable to run".
 *
 * Nothing lives here. It imports the real CLI in-process, so there is no second
 * process to spawn and no argv to forward: `@cairnkit/cli` reads `process.argv`
 * itself and behaves exactly as it does under its own name.
 */
import "@cairnkit/cli/dist/bin.js";
