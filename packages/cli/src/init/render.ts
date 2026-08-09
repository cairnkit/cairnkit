/**
 * How `cairn init` looks.
 *
 * Kept apart from the command so the decision-making and the presentation can
 * change independently, and so colour can be switched off wholesale.
 */

/**
 * Colour only when a human is watching.
 *
 * Escape sequences were previously written unconditionally, so redirecting the
 * output to a file or a CI log filled it with `[32m`. `NO_COLOR` is the
 * de-facto opt-out and costs nothing to honour.
 */
const useColour =
  Boolean(process.stdout.isTTY) && !process.env.NO_COLOR && process.env.TERM !== "dumb";

const paint = (code: string) => (text: string) =>
  useColour ? `[${code}m${text}[0m` : text;

export const bold = paint("1");
export const dim = paint("2");
export const green = paint("32");
export const yellow = paint("33");
export const cyan = paint("36");

/** A rule the width of the terminal, capped so it stays readable. */
export function rule(): string {
  const width = Math.min(process.stdout.columns || 72, 72);
  return dim("─".repeat(width));
}

/**
 * Code gets its own gutter so the eye can separate "read this" from "type
 * this" at a glance. A left bar rather than a drawn box: boxes have to be
 * measured against the terminal width and wrap badly when they guess wrong,
 * whereas a gutter degrades to something still readable.
 */
export function block(lines: string[], indent = "  "): string {
  return lines
    .map((line) => `${indent}${dim("│")}  ${line ? cyan(line) : ""}`)
    .join("\n");
}

export function heading(index: number, text: string): string {
  return `  ${bold(green(String(index)))}  ${bold(text)}`;
}
