"use client";

import { useState } from "react";
import { SETUPS } from "./setup-data";
import { Snippet } from "./snippet";

/**
 * A file browser rather than a wall of snippets.
 *
 * The question people actually have is "what files do I end up with, and what
 * goes in each one" — a linear guide answers it badly because you cannot see
 * the shape of the result until you reach the bottom.
 */
export function SetupGuide() {
  const [setupId, setSetupId] = useState<"react" | "next">("react");
  const [fileIndex, setFileIndex] = useState(0);

  const setup = SETUPS.find((entry) => entry.id === setupId)!;
  const file = setup.files[Math.min(fileIndex, setup.files.length - 1)];

  return (
    <div className="sg">
      <div className="sg__switch" role="tablist" aria-label="Framework">
        {SETUPS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={setupId === entry.id}
            className={`sg__sw${setupId === entry.id ? " sg__sw--on" : ""}`}
            onClick={() => {
              setSetupId(entry.id);
              setFileIndex(0);
            }}
          >
            {entry.label}
          </button>
        ))}
        <span className="sg__blurb">{setup.blurb}</span>
      </div>

      <Snippet code={setup.install} file="Terminal" max={110} />

      <div className="sg__browser">
        <nav className="sg__tree" aria-label="Project files">
          <span className="sg__root">your-app/</span>
          {setup.files.map((entry, index) => (
            <button
              key={entry.path}
              className={`sg__file${index === fileIndex ? " sg__file--on" : ""}`}
              onClick={() => setFileIndex(index)}
            >
              <FileIcon />
              {entry.path}
            </button>
          ))}
        </nav>

        <div className="sg__view">
          <p className="sg__why">{file.why}</p>
          <Snippet code={file.code} file={file.path} max={420} />
        </div>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
