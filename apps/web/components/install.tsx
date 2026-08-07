"use client";

import { useState } from "react";

export function Install({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="snippet">
      <span className="snippet__dollar">$</span>
      <code>{command}</code>
      <button className="copy" onClick={copy} aria-label="Copy install command">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
