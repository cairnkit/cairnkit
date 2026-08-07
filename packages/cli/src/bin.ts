import { runCheck } from "./commands/check";

const [command = "check", ...rest] = process.argv.slice(2);

if (command !== "check") {
  console.error(`Unknown command "${command}". Usage: cairn check [dir]`);
  process.exit(1);
}

process.exit(runCheck(rest[0] ?? "src"));
