"use client";

import { anchor } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";

export default function AiPage() {
  return (
    <>
      <h1>Generate with AI</h1>
      <label className="field">
        <span>Prompt</span>
        <textarea {...anchor(anchors.ai.prompt)} rows={4} placeholder="Describe the role…" />
      </label>
      <button className="btn" {...anchor(anchors.ai.generate)}>Generate questions</button>
    </>
  );
}
