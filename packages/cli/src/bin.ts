import { runCheck } from "./commands/check";
import { CLI_NAME } from "./cli-name";
import { runInit } from "./commands/init";
import { runStatus } from "./commands/status";

const USAGE = `${CLI_NAME} · product tours that fail your build, not your users.

  ${CLI_NAME} check [dir...]   Fail when a tour points at UI that no longer exists.
                         Given nothing, scans whichever of src, app, pages,
                         walkthrough, lib and components exist — or the working
                         directory if none do. Several roots are scanned as one
                         project, so a flow in one can point at a component
                         in another.

  ${CLI_NAME} status [dir...]  Describe the tours in this project: every anchor,
                         whether it is applied, and which flows point at it.
                         Always exits 0 — describing is not judging.
    --json               Emit the anchor graph as JSON on stdout.

  ${CLI_NAME} init [options]   Scaffold anchors, a flow and a provider into this app.
    --dir <path>         Where to put them. Defaults to src/walkthrough.
    --dry-run            Print the plan and write nothing.

  --json is available on check and status. In that mode stdout carries exactly
  one JSON object and every human-facing message goes to stderr, so the output
  can be piped straight into a parser.
`;

const [command = "check", ...rest] = process.argv.slice(2);

if (command === "--help" || command === "-h" || command === "help") {
  console.log(USAGE);
  process.exit(0);
}

if (command === "init") {
  const dirFlag = rest.indexOf("--dir");
  process.exit(
    runInit({
      dir: dirFlag >= 0 ? rest[dirFlag + 1] : undefined,
      dryRun: rest.includes("--dry-run"),
    }),
  );
}

if (command === "status") {
  process.exit(
    runStatus(
      rest.filter((arg) => !arg.startsWith("-")),
      { json: rest.includes("--json") },
    ),
  );
}

if (command !== "check") {
  console.error(`Unknown command "${command}".\n`);
  console.error(USAGE);
  process.exit(1);
}

// Every path, not just the first — dropping the rest made the check report
// false failures with no clue that anything had been ignored.
const dirs = rest.filter((arg) => !arg.startsWith("-"));
process.exit(runCheck(dirs.length > 0 ? dirs : undefined, { json: rest.includes("--json") }));
