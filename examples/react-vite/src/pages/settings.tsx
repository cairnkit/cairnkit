import { useState } from "react";
import { anchor } from "@cairnkit/core";
import { useTourScope } from "@cairnkit/react";
import { TourLauncher } from "@cairnkit/ui";
import { anchors } from "../walkthrough/anchors";

const MEMBERS = [
  { name: "Kofi Frimpong", email: "kofi@northwind.co", role: "Owner" },
  { name: "Lena Sørensen", email: "lena@northwind.co", role: "Recruiter" },
  { name: "Ade Balogun", email: "ade@northwind.co", role: "Interviewer" },
];

type Tab = "members" | "sharing";

/**
 * The page that proves scope earns its keep.
 *
 * Two guides live at `/settings`. Switching tabs changes no URL, unmounts the
 * panel the running guide was describing, and leaves the tab strip — which
 * both guides open on — exactly where it was. Nothing in the DOM says the
 * guide is now in the wrong place, so the app says it instead.
 */
export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("members");

  // The one line that makes any of this work. cairnkit now knows which panel is
  // in front, and a guide belonging to the other one goes dormant.
  useTourScope(tab);

  return (
    <>
      <header className="top">
        <h1>Settings</h1>
        <div className="spacer" />
        <div className="avatar">KF</div>
      </header>

      <div className="content">
        <div className="tabs" {...anchor(anchors.settings.tabs)} style={{ width: "fit-content" }}>
          <button className={tab === "members" ? "on" : ""} onClick={() => setTab("members")}>
            Members
          </button>
          <button className={tab === "sharing" ? "on" : ""} onClick={() => setTab("sharing")}>
            Sharing
          </button>
        </div>

        {tab === "members" ? <MembersPanel /> : <SharingPanel />}
      </div>

      {/*
        One launcher, offering whichever guide belongs to the tab in front.
        Start the members guide, switch to Sharing, and this reappears with the
        sharing guide — the members one is dormant, not lost, and comes back on
        the step you left when you switch back.
      */}
      <TourLauncher
        flowId={tab === "members" ? "settings-members" : "settings-sharing"}
        label={`Guide: ${tab}`}
      />
    </>
  );
}

function MembersPanel() {
  /**
   * Two ways an anchored element can leave, which the runtime treats
   * differently: `remounted` swaps the key so React destroys and rebuilds the
   * node in one commit, `removed` takes it away for good.
   */
  const [generation, setGeneration] = useState(0);
  const [removed, setRemoved] = useState(false);

  return (
    <>
      <section className="panel" {...anchor(anchors.settings.membersList)}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((member) => (
              <tr key={member.email}>
                <td style={{ fontWeight: 500 }}>{member.name}</td>
                <td style={{ color: "var(--muted)" }}>{member.email}</td>
                <td>
                  <span className={`pill ${member.role === "Owner" ? "pill--ok" : ""}`}>
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        {removed ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            The card is gone. A guide pointing at it says so in a fraction of a second — it used to
            sit there for four.
          </p>
        ) : (
          <div key={generation} {...anchor(anchors.settings.fragile)}>
            <strong>Seat usage</strong>
            <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
              3 of 10 seats in use on the current plan.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn--ghost" onClick={() => setGeneration((n) => n + 1)}>
            Re-mount the card
          </button>
          <button className="btn btn--ghost" onClick={() => setRemoved((r) => !r)}>
            {removed ? "Bring the card back" : "Remove the card"}
          </button>
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        <button className="btn" {...anchor(anchors.settings.membersInvite)}>
          Invite teammate
        </button>
      </div>
    </>
  );
}

function SharingPanel() {
  const [days, setDays] = useState("7");

  return (
    <section className="panel">
      <div className="field" {...anchor(anchors.settings.sharingLink)}>
        <label htmlFor="share-link">Public link</label>
        <input id="share-link" readOnly value="https://northwind.co/apply/8f2c1a" />
      </div>

      <div className="field" {...anchor(anchors.settings.sharingExpiry)} style={{ marginTop: 12 }}>
        <label htmlFor="share-expiry">Expires after</label>
        <select id="share-expiry" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
        </select>
      </div>
    </section>
  );
}
