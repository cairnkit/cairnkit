import type { ReactNode } from "react";

/**
 * A deliberately small TS/TSX highlighter.
 *
 * Shiki and Prism are both excellent and both cost more than this page can
 * justify — the whole site ships less JavaScript than either would add. This
 * handles the six token classes that actually carry meaning in our snippets
 * and leaves everything else alone.
 *
 * Tokens are returned as React nodes rather than an HTML string, so nothing
 * has to be escaped and no `dangerouslySetInnerHTML` appears anywhere.
 */
const KEYWORDS =
  "import|from|export|default|const|let|var|function|return|if|else|for|while|" +
  "type|interface|declare|module|as|new|await|async|void|null|undefined|true|false|extends|typeof";

const PATTERN = new RegExp(
  [
    "(?<comment>/\\*[\\s\\S]*?\\*/|//[^\\n]*)",
    "(?<string>`(?:\\\\[\\s\\S]|[^`\\\\])*`|\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*')",
    `(?<keyword>\\b(?:${KEYWORDS})\\b)`,
    "(?<tag></?[A-Z][\\w.]*)",
    "(?<fn>\\b[a-zA-Z_$][\\w$]*(?=\\())",
    "(?<num>\\b\\d+(?:\\.\\d+)?\\b)",
  ].join("|"),
  "g",
);

const CLASS: Record<string, string> = {
  comment: "tk-c",
  string: "tk-s",
  keyword: "tk-k",
  tag: "tk-t",
  fn: "tk-f",
  num: "tk-n",
};

export function highlight(source: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) out.push(source.slice(last, index));

    const groups = match.groups ?? {};
    const kind = Object.keys(CLASS).find((name) => groups[name] !== undefined);

    out.push(
      kind ? (
        <span className={CLASS[kind]} key={key++}>
          {match[0]}
        </span>
      ) : (
        match[0]
      ),
    );

    last = index + match[0].length;
  }

  if (last < source.length) out.push(source.slice(last));
  return out;
}
