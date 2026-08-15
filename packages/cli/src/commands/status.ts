import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { MissingRoots, defaultRoots, scanProject } from "../scan";
import { printJson, statusReport } from "../reporters/json";
import { CLI_NAME } from "../cli-name";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

/**
 * What this project's tours are made of, without judging any of it.
 *
 * `check` answers "is anything wrong". This answers "what is there", which is a
 * different question and the one you need first: which anchors exist, which
 * elements carry them, which flows point where.
 *
 * It exists mostly for `--json`. An agent asked to add a tour has to know the
 * current anchor graph before it can write a sensible one, and that graph is
 * not derivable by grepping — it needs the registry path resolution and the
 * rule that flow files reference anchors rather than apply them. Every other
 * consumer that wants this (CI annotations, an editor extension) wants the same
 * shape, so it lives in the CLI rather than behind a separate integration.
 *
 * Always exits 0. Describing a project is not a verdict on it; `check` is the
 * command that can fail.
 */
export function runStatus(rootDirs?: string[], options: { json?: boolean } = {}): number {
  const roots =
    rootDirs === undefined || rootDirs.length === 0
      ? defaultRoots((path) => existsSync(resolve(path)))
      : rootDirs;

  let context;
  try {
    context = scanProject(roots);
  } catch (error) {
    if (error instanceof MissingRoots) {
      console.error(
        `Not found: ${error.roots.map((root) => relative(process.cwd(), root) || ".").join(", ")}`,
      );
      console.error(`Pass the directories to scan, for example: ${CLI_NAME} status src app`);
      return 1;
    }
    throw error;
  }

  const report = statusReport(context);

  if (options.json) {
    printJson(report);
    return 0;
  }

  const { summary } = report;
  console.log(
    `${CLI_NAME} status · ${summary.registered} anchors, ${summary.flows} flow(s)\n`,
  );

  for (const anchor of report.anchors) {
    // The two states worth a person's attention are the two that break things:
    // registered with nothing carrying it, and carried by something the
    // registry has never heard of.
    const mark = !anchor.registered
      ? yellow("?")
      : anchor.applied
        ? green("✓")
        : yellow("!");

    const where = anchor.declaredAt
      ? dim(`  ${anchor.declaredAt.file}:${anchor.declaredAt.line}`)
      : "";
    const flows = anchor.flows.length > 0 ? dim(`  ${anchor.flows.join(", ")}`) : "";

    console.log(`  ${mark} ${anchor.id.padEnd(34)}${flows}${where}`);
  }

  if (summary.orphaned > 0 || summary.unregistered > 0) {
    console.log(
      dim(
        `\n  ${summary.orphaned} registered but not applied, ` +
          `${summary.unregistered} applied but not registered. ` +
          `Run ${CLI_NAME} check for the detail.`,
      ),
    );
  }

  return 0;
}
