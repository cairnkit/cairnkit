"use client";

import { useState } from "react";
import { highlight } from "./highlight";

/**
 * Every code block on the playground: filename bar, copy button, colours.
 *
 * One component rather than three near-identical ones, because a snippet that
 * cannot be copied is a snippet the reader has to retype, and a reader who is
 * retyping has already decided this is too much work.
 */
export function Snippet({
  code,
  file,
  max = 460,
}: {
  code: string;
  file?: string;
  /** Cap the height so a long file cannot push the page off screen. */
  max?: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard is unavailable over plain http and in some embedded views.
      // Selecting the text still works, so this is not worth an error state.
    }
  }

  return (
    <div className="snip">
      <div className="snip__bar">
        <span className="snip__file">{file ?? "example.ts"}</span>
        <button className="snip__copy" onClick={copy} aria-label={`Copy ${file ?? "code"}`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="snip__pre" style={{ maxHeight: max }}>
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}
