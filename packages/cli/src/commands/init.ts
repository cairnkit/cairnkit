import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { detect } from "../init/detect";
import { plan } from "../init/plan";
import type { Reader } from "../init/types";

const bold = (text: string) => `[1m${text}[0m`;
const dim = (text: string) => `[2m${text}[0m`;
const green = (text: string) => `[32m${text}[0m`;
const yellow = (text: string) => `[33m${text}[0m`;

export type InitOptions = {
  cwd?: string;
  dir?: string;
  dryRun?: boolean;
};

/** Returns the process exit code. */
export function runInit(options: InitOptions = {}): number {
  const cwd = resolve(options.cwd ?? process.cwd());

  const reader: Reader = {
    exists: (path) => existsSync(join(cwd, path)),
    read: (path) => {
      try {
        return readFileSync(join(cwd, path), "utf8");
      } catch {
        return null;
      }
    },
  };

  if (!reader.exists("package.json")) {
    console.error("No package.json here. Run cairn init from the root of your app.");
    return 1;
  }

  const context = detect(reader);
  const result = plan(context, reader, options.dir);

  console.log("");
  console.log(`${bold("Detected")}  ${describe(context)}`);
  console.log("");

  if (result.write.length === 0) {
    console.log(green("Everything is already in place — nothing to write."));
    if (result.skip.length > 0) {
      for (const entry of result.skip) console.log(dim(`  kept  ${entry.path}`));
    }
    return 0;
  }

  for (const file of result.write) {
    console.log(`  ${green("create")}  ${file.path}  ${dim(file.reason)}`);
  }
  for (const entry of result.skip) {
    console.log(`  ${dim("keep")}    ${entry.path}  ${dim(entry.why)}`);
  }

  // Guard against writing outside the project even if a path is coaxed in.
  for (const file of options.dryRun ? [] : result.write) {
    const target = resolve(cwd, file.path);
    if (!target.startsWith(cwd + "/")) {
      console.error(`Refusing to write outside the project: ${file.path}`);
      return 1;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.contents, "utf8");
  }

  console.log("");
  console.log(
    options.dryRun
      ? dim(`Dry run — nothing written. The rest of the plan follows.`)
      : green(
          `Wrote ${result.write.length} files to ${relative(cwd, resolve(cwd, result.dir)) || "."}`,
        ),
  );

  if (result.install) {
    console.log("");
    console.log(bold("Install the packages"));
    for (const line of result.install.command.split("\n")) console.log(`    ${line}`);
  }

  console.log("");
  console.log(bold("Then, by hand"));
  console.log(dim("  (we do not edit your layout — a mangled root file is not worth the minute saved)"));
  for (const line of result.nextSteps) console.log(line ? `  ${line}` : "");

  if (result.warnings.length > 0) {
    console.log("");
    for (const warning of result.warnings) console.log(`${yellow("!")} ${warning}`);
  }

  console.log("");
  console.log(dim("Docs: https://cairnkit.dev/docs/install"));
  console.log("");
  return 0;
}

function describe(context: ReturnType<typeof detect>): string {
  const { framework, bundler, typescript, packageManager } = context;

  const name =
    framework.kind === "next-app"
      ? "Next.js (App Router)"
      : framework.kind === "next-pages"
        ? "Next.js (Pages Router)"
        : framework.kind === "react-router"
          ? `React + ${framework.pkg}`
          : framework.kind === "react"
            ? "React"
            : framework.hint
              ? `React + ${framework.hint} (no adapter yet)`
              : "unrecognised framework";

  const parts = [name];
  if (bundler === "vite") parts.push("Vite");
  parts.push(typescript ? "TypeScript" : "JavaScript");
  parts.push(packageManager);
  return parts.join(dim(" · "));
}
