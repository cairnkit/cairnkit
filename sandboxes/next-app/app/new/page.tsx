"use client";

import { anchor } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";

export default function NewQuestionPage() {
  return (
    <>
      <h1>New question</h1>
      <label className="field">
        <span>Title</span>
        <input {...anchor(anchors.form.title)} placeholder="Internal label" />
      </label>
      <label className="field">
        <span>Question text</span>
        <textarea {...anchor(anchors.form.body)} rows={4} placeholder="What candidates see" />
      </label>
      <button className="btn" {...anchor(anchors.form.submit)}>Save to library</button>
    </>
  );
}
