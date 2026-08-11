import { runCheck } from "./commands/check";
import { CLI_NAME } from "./cli-name";
import { runInit } from "./commands/init";

const USAGE = `${CLI_NAME} · product tours that fail your build, not your users.

  ${CLI_NAME} check [dir...]   Fail when a tour points at UI that no longer exists.
                         Defaults to "src". Several roots are scanned as one
                         project, so a flow in one can point at a component
                         in another.

  ${CLI_NAME} init [options]   Scaffold anchors, a flow and a provider into this app.
    --dir <path>         Where to put them. Defaults to src/walkthrough.
    --dry-run            Print the plan and write nothing.
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

if (command !== "check") {
  console.error(`Unknown command "${command}".\n`);
  console.error(USAGE);
  process.exit(1);
}

// Every path, not just the first — dropping the rest made the check report
// false failures with no clue that anything had been ignored.
const dirs = rest.filter((arg) => !arg.startsWith("-"));
process.exit(runCheck(dirs.length > 0 ? dirs : undefined));
