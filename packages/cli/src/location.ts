import { readFileSync } from "node:fs";
import { relative } from "node:path";
import type { Location } from "./checks/types";

/** A location with the line worked out, ready to print or serialise. */
export type ResolvedLocation = { file: string; line: number };

/**
 * Turn a byte offset into `path:line`.
 *
 * The scanner records offsets because counting lines during the scan would mean
 * walking every file twice, and most files never produce a finding. The count
 * happens here instead, once, only for the handful of places that are actually
 * being reported.
 *
 * Shared by both reporters. It used to live inside the console one, so the JSON
 * output would have had to reimplement it and the two could disagree about
 * which line a finding was on.
 */
export function resolveLocation(at: Location): ResolvedLocation {
  const file = relative(process.cwd(), at.file) || ".";

  try {
    const source = readFileSync(at.file, "utf8");
    let line = 1;
    for (let i = 0; i < at.offset; i += 1) if (source.charCodeAt(i) === 10) line += 1;
    return { file, line };
  } catch {
    // The file was readable during the scan and is not now. Report the finding
    // without a line rather than losing the finding.
    return { file, line: 1 };
  }
}
