"use client";

import { useState } from "react";
import { anchor } from "@cairnkit/core";
import { useTourScope } from "@cairnkit/react";
import { TourLauncher } from "@cairnkit/ui";
import { anchors } from "@/walkthrough/anchors";

/**
 * Two guides behind one URL, under App Router.
 *
 * Switching tabs changes no pathname, so the router adapter sees nothing and
 * `pauseRoutes` has nothing to match. `useTourScope` is what tells Cairn which
 * panel is in front; a guide belonging to the other one goes dormant and
 * resumes on the step it left.
 */
export default function PrefsPage() {
  const [tab, setTab] = useState<"general" | "sharing">("general");

  useTourScope(tab);

  return (
    <>
      <h1>Preferences</h1>

      <div className="tabs" {...anchor(anchors.prefs.tabs)}>
        <button className={tab === "general" ? "on" : ""} onClick={() => setTab("general")}>
          General
        </button>
        <button className={tab === "sharing" ? "on" : ""} onClick={() => setTab("sharing")}>
          Sharing
        </button>
      </div>

      {tab === "general" ? (
        <label className="field" {...anchor(anchors.prefs.general)}>
          <span>Default question type</span>
          <select defaultValue="video">
            <option value="video">Video answer</option>
            <option value="choice">Multiple choice</option>
          </select>
        </label>
      ) : (
        <label className="field" {...anchor(anchors.prefs.sharing)}>
          <span>Library visibility</span>
          <select defaultValue="private">
            <option value="private">Private to me</option>
            <option value="team">Anyone on the team</option>
          </select>
        </label>
      )}

      {/* Offers whichever guide covers the tab in front. */}
      <TourLauncher
        flowId={tab === "general" ? "prefs-general" : "prefs-sharing"}
        label={`Guide: ${tab}`}
      />
    </>
  );
}
