import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { detect } from "../init/detect";
import { plan } from "../init/plan";
import { block, bold, cyan, dim, green, heading, rule, yellow } from "../init/render";
import type { Reader } from "../init/types";
import { CLI_NAME } from "../cli-name";

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
    console.error(`No package.json here. Run ${CLI_NAME} init from the root of your app.`);
    return 1;
  }

  const context = detect(reader);
  const result = plan(context, reader, options.dir);
  const out = (line = "") => console.log(line);

  out();
  out(`  ${bold(`${CLI_NAME} init`)}   ${dim(describe(context))}`);
  out();

  if (result.write.length === 0) {
    out(`  ${green("Everything is already in place.")} Nothing to write.`);
    for (const entry of result.skip) out(`    ${dim(entry.path)}`);
    out();
    return 0;
  }

  const width = Math.max(...result.write.map((file) => file.path.length));
  for (const file of result.write) {
    out(`  ${green("+")}  ${file.path.padEnd(width)}  ${dim(file.reason)}`);
  }
  for (const entry of result.skip) {
    out(`  ${dim("·")}  ${dim(entry.path.padEnd(width))}  ${dim(entry.why)}`);
  }

  if (!options.dryRun) {
    // Guard against writing outside the project even if a path is coaxed in.
    for (const file of result.write) {
      const target = resolve(cwd, file.path);
      if (!target.startsWith(cwd + "/")) {
        console.error(`Refusing to write outside the project: ${file.path}`);
        return 1;
      }
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.contents, "utf8");
    }
  }

  out();
  out(
    options.dryRun
      ? dim("  Dry run — nothing written. The rest of the plan follows.")
      : dim(`  Written to ${relative(cwd, resolve(cwd, result.dir)) || "."}/`),
  );
  out();
  out(rule());
  out();
  out(`  ${bold("What is left to you")}`);
  out(`  ${dim("We do not edit your layout — a mangled root file is not worth")}`);
  out(`  ${dim("the minute it would save.")}`);
  out();

  let step = 0;

  if (result.install) {
    step += 1;
    out(heading(step, "Install the packages"));
    out();
    out(block(result.install.command.split("\n"), "     "));
    out();
  }

  for (const next of result.nextSteps) {
    step += 1;
    out(heading(step, next.text));
    if (next.file) out(`     ${dim(next.file)}`);
    if (next.code) {
      out();
      out(block(next.code, "     "));
    }
    out();
  }

  if (result.warnings.length > 0) {
    out(rule());
    out();
    for (const warning of result.warnings) out(`  ${yellow("!")}  ${wrap(warning, 68, "     ")}`);
    out();
  }

  out(`  ${dim("Docs")}  ${cyan("https://cairnkit.dev/docs/install")}`);
  out();
  return 0;
}

/** Soft-wraps a warning so long sentences do not run off a narrow terminal. */
function wrap(text: string, width: number, indent: string): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join(`\n${indent}`);
}

function describe(context: ReturnType<typeof detect>): string {
  const { framework, bundler, typescript, packageManager } = context;

  const name =
    framework.kind === "next-app"
      ? "Next.js App Router"
      : framework.kind === "next-pages"
        ? "Next.js Pages Router"
        : framework.kind === "react-router"
          ? `React · ${framework.pkg}`
          : framework.kind === "react"
            ? "React"
            : framework.hint
              ? `React · ${framework.hint} (no adapter yet)`
              : "unrecognised framework";

  const parts = [name];
  if (bundler === "vite") parts.push("Vite");
  parts.push(typescript ? "TypeScript" : "JavaScript");
  parts.push(packageManager);
  return parts.join(" · ");
}
