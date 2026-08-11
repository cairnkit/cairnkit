import { NavLink, Route, Routes } from "react-router-dom";
import { anchor } from "@cairnkit/core";
import { useState } from "react";
import { CairnProvider, useTourDeepLink, type CairnNotice } from "@cairnkit/react";
import { CairnNoticeBar, CairnOverlay } from "@cairnkit/ui";
import { useReactRouterAdapter } from "./router-adapter";
import { anchors } from "./walkthrough/anchors";
import { flows } from "./walkthrough/flows";
import { PipelinePage } from "./pages/pipeline";
import { QuestionsPage } from "./pages/questions";
import { ComposePage } from "./pages/compose";
import { SettingsPage } from "./pages/settings";

const CairnMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <ellipse cx="12" cy="18.7" rx="9.2" ry="2.7" />
    <ellipse cx="13" cy="12.2" rx="6.6" ry="2.5" />
    <ellipse cx="10.9" cy="6" rx="4.4" ry="2.25" />
  </svg>
);

function Shell({ notice, onClear }: { notice: CairnNotice | null; onClear: () => void }) {
  // Lets support deep-link someone straight into a guide: ?tour=invite-candidate
  useTourDeepLink();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <CairnMark /> Northwind
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")} {...anchor(anchors.nav.pipeline)}>
            Pipeline
          </NavLink>
          <NavLink to="/questions" className={({ isActive }) => (isActive ? "on" : "")} {...anchor(anchors.nav.questions)}>
            Questions
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "on" : "")} {...anchor(anchors.nav.settings)}>
            Settings
          </NavLink>
        </nav>
      </aside>

      <div className="main">
        <Routes>
          <Route path="/" element={<PipelinePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/questions/new" element={<ComposePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>

      <CairnOverlay />
      <CairnNoticeBar notice={notice} onDismiss={onClear} />
    </div>
  );
}

export function App() {
  const [notice, setNotice] = useState<CairnNotice | null>(null);

  return (
    <CairnProvider
      flows={flows}
      router={useReactRouterAdapter()}
      onEvent={(e) => console.log("[cairn]", e.name, e.props)}
      onNotice={setNotice}
    >
      <Shell notice={notice} onClear={() => setNotice(null)} />
    </CairnProvider>
  );
}
