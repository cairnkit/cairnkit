import { useNavigate } from "react-router-dom";
import { anchor } from "@cairnkit/core";
import { anchors } from "../walkthrough/anchors";

export function ComposePage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="top">
        <h1>New Question</h1>
        <div className="spacer" />
        <div className="avatar">KF</div>
      </header>

      <div className="content">
        <section className="panel" style={{ marginTop: 0, padding: 22 }}>
          <label className="field">
            <span>Internal title</span>
            <input {...anchor(anchors.compose.title)} placeholder="System design — depth" />
          </label>
          <label className="field">
            <span>Question text</span>
            <textarea {...anchor(anchors.compose.prompt)} rows={5} placeholder="What the candidate sees…" />
          </label>
          <div className="grid2" style={{ maxWidth: 560 }}>
            <label className="field"><span>Category</span>
              <select defaultValue="be"><option value="be">Backend</option><option value="ge">General</option></select>
            </label>
            <label className="field"><span>Time limit</span>
              <select defaultValue="3"><option value="2">2 minutes</option><option value="3">3 minutes</option></select>
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" onClick={() => navigate("/questions")}>Cancel</button>
            <button className="btn" {...anchor(anchors.compose.save)}>Save To Library</button>
          </div>
        </section>
      </div>
    </>
  );
}
