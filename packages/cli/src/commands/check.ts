import { anchorsApplied } from "../checks/anchors-applied";
import { anchorsRegistered } from "../checks/anchors-registered";
import { routeConflicts } from "../checks/route-conflicts";
import type { Finding } from "../checks/types";
import { reportFindings } from "../reporters/console";
import { scanProject } from "../scan";

const CHECKS = [anchorsApplied, anchorsRegistered, routeConflicts];

/** Returns the process exit code. */
export function runCheck(rootDirs: string | string[] = "src"): number {
  const roots = Array.isArray(rootDirs) ? rootDirs : [rootDirs];
  const context = scanProject(roots);

  if (context.registered.size === 0) {
    console.error(
      `No anchors found under ${roots.map((d) => `"${d}"`).join(", ")}. ` +
        "Is defineAnchors() in one of these directories?",
    );
    return 1;
  }

  const findings: Finding[] = CHECKS.flatMap((check) => check(context));
  reportFindings(findings, context.registered.size);

  return findings.length > 0 ? 1 : 0;
}
