"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { anchor } from "@cairnkit/core";
import { TourLauncher } from "@cairnkit/ui";
import { anchors } from "@/walkthrough/anchors";

export default function LibraryPage() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <h1>Question library</h1>

      <div className="tabs" {...anchor(anchors.library.tabs)}>
        <span>All questions</span>
        <span>Templates</span>
      </div>

      <button
        className="btn btn--ghost"
        style={{ marginTop: 20 }}
        {...anchor(anchors.library.settingsButton)}
        onClick={() => setSettingsOpen(true)}
      >
        Interview settings
      </button>

      <div className="cards">
        <div className="card" {...anchor(anchors.library.manualCard)}>
          <strong>Create manually</strong>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Full control over the wording.</p>
          <button className="btn" {...anchor(anchors.library.manualCta)} onClick={() => router.push("/new")}>
            Create manually
          </button>
        </div>

        <div className="card" {...anchor(anchors.library.aiCard)}>
          <strong>Generate with AI</strong>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Describe the role, edit the draft.</p>
          <button className="btn" onClick={() => router.push("/ai")}>Generate with AI</button>
        </div>
      </div>

      <div className="list" {...anchor(anchors.library.list)}>No questions yet.</div>

      {/* A real dialog, so the guide has to spotlight something inside a portal. */}
      {settingsOpen && (
        <div className="backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Interview settings" onClick={(e) => e.stopPropagation()}>
            <strong>Interview settings</strong>
            <label className="field">
              <span>Difficulty</span>
              <select {...anchor(anchors.settings.difficulty)} defaultValue="mid">
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </label>
            <button className="btn" {...anchor(anchors.settings.save)} onClick={() => setSettingsOpen(false)}>
              Save settings
            </button>
          </div>
        </div>
      )}

      <TourLauncher flowId="create-manual" />
    </>
  );
}
