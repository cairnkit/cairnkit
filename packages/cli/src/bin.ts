import { runCheck } from "./commands/check";

const [command = "check", ...rest] = process.argv.slice(2);

if (command !== "check") {
  console.error(`Unknown command "${command}". Usage: cairn check [dir...]`);
  process.exit(1);
}

// Every path, not just the first — dropping the rest made the check report
// false failures with no clue that anything had been ignored.
process.exit(runCheck(rest.length > 0 ? rest : "src"));
