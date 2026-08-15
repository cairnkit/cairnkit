import { anchorsApplied } from "../checks/anchors-applied";
import { anchorsRegistered } from "../checks/anchors-registered";
import { routeConflicts } from "../checks/route-conflicts";
import type { Finding } from "../checks/types";
import { reportFindings } from "../reporters/console";
import { checkReport, printJson } from "../reporters/json";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { MissingRoots, defaultRoots, scanProject } from "../scan";
import { CLI_NAME } from "../cli-name";

const CHECKS = [anchorsApplied, anchorsRegistered, routeConflicts];

export type CheckOptions = {
  /**
   * Emit the findings as JSON on stdout instead of prose.
   *
   * In this mode stdout carries exactly one JSON object and nothing else, so a
   * caller can pipe it straight into a parser. Every human-facing message moves
   * to stderr, including the failures below that are not findings at all: a
   * consumer that gets half a log line and half an object cannot tell a warning
   * from corruption.
   */
  json?: boolean;
};

/** Returns the process exit code. `undefined` means "work it out". */
export function runCheck(rootDirs?: string | string[], options: CheckOptions = {}): number {
  const roots =
    rootDirs === undefined
      ? defaultRoots((path) => existsSync(resolve(path)))
      : Array.isArray(rootDirs)
        ? rootDirs
        : [rootDirs];

  /*
   * Both bail-outs below are real failures rather than findings, and a JSON
   * consumer still needs a parseable answer for them. They are reported as a
   * finding with their own rule so the shape on stdout never varies.
   */
  const fail = (rule: string, message: string, hint: string) => {
    if (options.json) {
      printJson(checkReport([{ rule, message, hint, detail: [] }], 0));
    } else {
      console.error(message);
      console.error(hint);
    }
    return 1;
  };

  let context;
  try {
    context = scanProject(roots);
  } catch (error) {
    if (error instanceof MissingRoots) {
      // A path that is not there is a typo, not a crash.
      const missing = error.roots.map((root) => relative(process.cwd(), root) || ".").join(", ");
      return fail(
        "roots-missing",
        `Not found: ${missing}`,
        `Pass the directories to scan, for example: ${CLI_NAME} check src app`,
      );
    }
    throw error;
  }

  if (context.registered.size === 0) {
    return fail(
      "no-anchors",
      `No anchors found in ${roots.map((d) => `"${d}"`).join(", ")}.`,
      `Is defineAnchors() somewhere else? Pass the directory: ${CLI_NAME} check <dir>`,
    );
  }

  const findings: Finding[] = CHECKS.flatMap((check) => check(context));

  if (options.json) printJson(checkReport(findings, context.registered.size));
  else reportFindings(findings, context.registered.size);

  return findings.length > 0 ? 1 : 0;
}
