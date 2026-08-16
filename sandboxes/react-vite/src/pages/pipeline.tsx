import { useState } from "react";
import { anchor } from "@cairnkit/core";
import { TourLauncher } from "@cairnkit/ui";
import { anchors } from "../walkthrough/anchors";

const CANDIDATES = [
  { name: "Amara Okonkwo", role: "Senior Backend Engineer", stage: "Interview", when: "2h ago", tone: "ok" },
  { name: "Tomás Herrera", role: "Product Designer", stage: "Screening", when: "5h ago", tone: "" },
  { name: "Priya Raman", role: "Senior Backend Engineer", stage: "Offer", when: "1d ago", tone: "ok" },
  { name: "Jonas Wei", role: "Data Analyst", stage: "Awaiting reply", when: "3d ago", tone: "warn" },
];

export function PipelinePage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <header className="top">
        <h1>Pipeline</h1>
        <TourLauncher flowId="invite-candidate" position="inline" pulse={false} />
        <div className="spacer" />
        <button className="btn" {...anchor(anchors.pipeline.inviteCta)} onClick={() => setInviteOpen(true)}>
          Invite Candidate
        </button>
        <div className="avatar">KF</div>
      </header>

      <div className="content">
        <div className="stats" {...anchor(anchors.pipeline.stats)}>
          <div className="stat"><b>24</b><span>Active candidates</span></div>
          <div className="stat"><b>6</b><span>Awaiting review</span></div>
          <div className="stat"><b>3</b><span>Offers out</span></div>
          <div className="stat"><b>68%</b><span>Completion rate</span></div>
        </div>

        <section className="panel" {...anchor(anchors.pipeline.table)}>
          {/*
            Deliberately a bare attribute rather than {...anchor(...)}.

            Both forms are supported and the spread is what the docs teach, but
            the bare one has its own branch in the scanner and shipped broken
            once. This is the fixture that keeps CI honest about it; see the
            note beside `exportCsv` in the anchor registry.
          */}
          <div className="panel__head">
            <h2>Recent Activity</h2>
            <button className="btn btn--quiet" data-cairn="pipeline.export-csv">Export CSV</button>
          </div>
          <table>
            <thead>
              <tr><th>Candidate</th><th>Role</th><th>Stage</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c) => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 550 }}>{c.name}</td>
                  <td style={{ color: "var(--muted)" }}>{c.role}</td>
                  <td><span className={`pill ${c.tone ? `pill--${c.tone}` : ""}`}>{c.stage}</span></td>
                  <td style={{ color: "var(--muted)" }}>{c.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {inviteOpen && (
        <div className="backdrop" onClick={() => setInviteOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Invite candidate" onClick={(e) => e.stopPropagation()}>
            <h3>Invite Candidate</h3>
            <p>They'll get a link and can start whenever suits them.</p>
            <label className="field">
              <span>Email address</span>
              <input {...anchor(anchors.invite.email)} type="email" placeholder="name@company.com" />
            </label>
            <label className="field">
              <span>Role</span>
              <select {...anchor(anchors.invite.role)} defaultValue="be">
                <option value="be">Senior Backend Engineer</option>
                <option value="pd">Product Designer</option>
                <option value="da">Data Analyst</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn--ghost" onClick={() => setInviteOpen(false)}>Cancel</button>
              <button className="btn" {...anchor(anchors.invite.send)} onClick={() => setInviteOpen(false)}>Send Invite</button>
            </div>
          </div>
        </div>
      )}

      <TourLauncher flowId="invite-candidate" position="bottom-right" />
    </>
  );
}
