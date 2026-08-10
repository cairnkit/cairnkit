import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { anchor } from "@cairnkit/core";
import { TourLauncher } from "@cairnkit/ui";
import { anchors } from "../walkthrough/anchors";

const QUESTIONS = [
  { q: "Walk me through a system you designed end to end.", tag: "Backend", state: "Published" },
  { q: "Describe a time you disagreed with a design decision.", tag: "General", state: "Published" },
  { q: "How would you improve our onboarding flow?", tag: "Design", state: "Draft" },
];

export function QuestionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");

  return (
    <>
      <header className="top">
        <h1>Questions</h1>
        <div className="spacer" />
        <button className="btn" {...anchor(anchors.questions.newCta)} onClick={() => navigate("/questions/new")}>
          New Question
        </button>
        <div className="avatar">KF</div>
      </header>

      <div className="content">
        <div className="tabs" {...anchor(anchors.questions.tabs)} style={{ width: "fit-content" }}>
          {["all", "published", "drafts"].map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t[0]!.toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <section className="panel" {...anchor(anchors.questions.list)}>
          <table>
            <thead><tr><th>Question</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              {QUESTIONS.map((row) => (
                <tr key={row.q}>
                  <td style={{ fontWeight: 500 }}>{row.q}</td>
                  <td style={{ color: "var(--muted)" }}>{row.tag}</td>
                  <td><span className={`pill ${row.state === "Published" ? "pill--ok" : ""}`}>{row.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Parked away from the default corner, to prove position works. */}
      <TourLauncher flowId="write-question" position="bottom-left" />
    </>
  );
}
