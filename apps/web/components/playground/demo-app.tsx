"use client";

import { anchor } from "@cairnkit/core";
import { useTourAction } from "@cairnkit/react";
import { anchors } from "@/walkthrough/anchors";

/**
 * The fake product the playground tours.
 *
 * Deliberately a real interactive UI rather than a picture: the modal opens,
 * traps focus and covers the buttons behind it, which is the situation the
 * interesting half of the API exists to handle. A screenshot could not show
 * that going wrong, so it could not show it being fixed either.
 */
export function DemoApp({
  settingsOpen,
  onSettingsOpen,
  onSettingsClose,
}: {
  settingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
}) {
  // The modal scenario's steps call these by name. Published here, in the
  // component that owns the state, because the flow file cannot see it.
  useTourAction("demo:close-settings", onSettingsClose);
  // Needed for Back: the step before this one closed the dialog on its way
  // out, so returning to a step anchored inside it has to reopen it first.
  useTourAction("demo:open-settings", onSettingsOpen);

  return (
    <div className="demo" role="group" aria-label="Demo application">
      <aside className="demo__side">
        <div className="demo__brand">
          <span className="demo__logo" />
          Acme
        </div>
        <nav className="demo__nav">
          <span {...anchor(anchors.demo.nav)} className="demo__navitem demo__navitem--on">
            Projects
          </span>
          <span className="demo__navitem">Members</span>
          <span className="demo__navitem">Billing</span>
        </nav>
      </aside>

      <div className="demo__main">
        <header className="demo__bar">
          <h4>Projects</h4>
          <div className="demo__actions">
            <button
              {...anchor(anchors.demo.settings)}
              className="demo__btn"
              onClick={onSettingsOpen}
            >
              Settings
            </button>
            <button {...anchor(anchors.demo.create)} className="demo__btn demo__btn--primary">
              New project
            </button>
          </div>
        </header>

        <div className="demo__rows">
          {["Onboarding revamp", "Billing migration", "Design tokens"].map((row) => (
            <div className="demo__row" key={row}>
              <span className="demo__dot" />
              {row}
              <span className="demo__meta">Updated today</span>
            </div>
          ))}
        </div>

        <footer className="demo__foot">
          <button {...anchor(anchors.demo.save)} className="demo__btn demo__btn--primary">
            Save changes
          </button>
        </footer>
      </div>

      {settingsOpen && (
        <div className="demo__scrim" onClick={onSettingsClose}>
          {/* role="dialog" is what tells the overlay to portal into the modal
              instead of rendering behind it. */}
          <div
            className="demo__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Project settings"
            onClick={(event) => event.stopPropagation()}
          >
            <h5>Project settings</h5>
            {/* The anchor goes on a control, not the dialog itself. Pointing
                at the whole panel leaves the card nowhere to sit — it gets
                pushed outside the dialog entirely — and "look at this dialog"
                is rarely what a step means anyway. */}
            <label {...anchor(anchors.demo.panel)} className="demo__field">
              Visibility
              <select defaultValue="Private">
                <option>Private</option>
                <option>Team</option>
              </select>
            </label>
            <label className="demo__field">
              Notifications
              <select defaultValue="Weekly">
                <option>Weekly</option>
                <option>Daily</option>
              </select>
            </label>
            <button className="demo__btn" onClick={onSettingsClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
