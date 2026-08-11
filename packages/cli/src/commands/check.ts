import { anchorsApplied } from "../checks/anchors-applied";
import { anchorsRegistered } from "../checks/anchors-registered";
import { routeConflicts } from "../checks/route-conflicts";
import type { Finding } from "../checks/types";
import { reportFindings } from "../reporters/console";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { MissingRoots, defaultRoots, scanProject } from "../scan";
import { CLI_NAME } from "../cli-name";

const CHECKS = [anchorsApplied, anchorsRegistered, routeConflicts];

/** Returns the process exit code. `undefined` means "work it out". */
export function runCheck(rootDirs?: string | string[]): number {
  const roots =
    rootDirs === undefined
      ? defaultRoots((path) => existsSync(resolve(path)))
      : Array.isArray(rootDirs)
        ? rootDirs
        : [rootDirs];

  let context;
  try {
    context = scanProject(roots);
  } catch (error) {
    if (error instanceof MissingRoots) {
      // A path that is not there is a typo, not a crash.
      console.error(
        `Not found: ${error.roots.map((root) => relative(process.cwd(), root) || ".").join(", ")}`,
      );
      console.error(`Pass the directories to scan, for example: ${CLI_NAME} check src app`);
      return 1;
    }
    throw error;
  }

  if (context.registered.size === 0) {
    console.error(
      `No anchors found in ${roots.map((d) => `"${d}"`).join(", ")}. ` +
        `Is defineAnchors() somewhere else? Pass the directory: ${CLI_NAME} check <dir>`,
    );
    return 1;
  }

  const findings: Finding[] = CHECKS.flatMap((check) => check(context));
  reportFindings(findings, context.registered.size);

  return findings.length > 0 ? 1 : 0;
}
