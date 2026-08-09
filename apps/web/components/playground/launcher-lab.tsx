"use client";

import { useState, type ReactNode } from "react";
import type { LauncherPosition } from "@cairnkit/ui";
import { TourLauncher } from "@cairnkit/ui";
import { usePlayground } from "./playground-root";
import { SCENARIOS } from "./scenarios";
import { Snippet } from "@/components/ui/snippet";

const POSITIONS: LauncherPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

/**
 * `icon` is typed `ReactNode`, so anything React can render works — an emoji,
 * an SVG, an `<img>` of your own logo, a spinner. These are only examples.
 */
const ICONS: { id: string; label: string; node: ReactNode; source: string }[] = [
  { id: "default", label: "Default", node: null, source: "" },
  {
    id: "emoji",
    label: "Emoji",
    node: <span style={{ fontSize: 17 }}>🧭</span>,
    source: `icon={<span>🧭</span>}`,
  },
  {
    id: "svg",
    label: "SVG",
    node: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" strokeLinecap="round" />
        <circle cx="12" cy="16.4" r=".9" fill="currentColor" stroke="none" />
      </svg>
    ),
    source: `icon={<HelpIcon />}`,
  },
  {
    id: "img",
    label: "Your logo",
    node: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/favicon-32x32.png" alt="" width={17} height={17} />
    ),
    source: `icon={<img src="/logo.svg" alt="" width={18} height={18} />}`,
  },
  {
    id: "text",
    label: "Text",
    node: <span style={{ fontSize: 12, fontWeight: 700 }}>?</span>,
    source: `icon={<span>?</span>}`,
  },
];

export function LauncherLab() {
  const [position, setPosition] = useState<LauncherPosition>("bottom-right");
  const [iconId, setIconId] = useState("default");
  const [pulse, setPulse] = useState(true);
  const [shown, setShown] = useState(true);

  // Reads the same config as the stage, so the launcher starts whichever
  // scenario is selected up the page rather than a fixed one.
  const { config } = usePlayground();
  const scenario = SCENARIOS.find((entry) => entry.id === config.scenario)!;
  const icon = ICONS.find((entry) => entry.id === iconId)!;

  const code = `<TourLauncher
  flowId="playground"
  label="Watch guide"
  position="${position}"${pulse ? "\n  pulse" : ""}${icon.source ? `\n  ${icon.source}` : ""}
/>`;

  return (
    <div className="lab">
      <div className="lab__controls">
        <div className="lab__group">
          <span className="lab__label">position</span>
          {/* A 3×2 grid that mirrors the screen, so the control looks like
              the thing it controls. */}
          <div className="lab__grid" role="radiogroup" aria-label="Launcher position">
            {POSITIONS.map((option) => (
              <button
                key={option}
                role="radio"
                aria-checked={position === option}
                aria-label={option}
                title={option}
                className={`lab__cell${position === option ? " lab__cell--on" : ""}`}
                onClick={() => setPosition(option)}
              >
                <span className="lab__pip" />
              </button>
            ))}
          </div>
          <code className="lab__value">{position}</code>
        </div>

        <div className="lab__group">
          <span className="lab__label">icon</span>
          <div className="lab__icons">
            {ICONS.map((entry) => (
              <button
                key={entry.id}
                className={`lab__icon${iconId === entry.id ? " lab__icon--on" : ""}`}
                onClick={() => setIconId(entry.id)}
                title={entry.label}
              >
                {entry.node ?? <span className="lab__stones" />}
              </button>
            ))}
          </div>
          <p className="lab__note">
            <code>icon</code> is a <code>ReactNode</code> — an SVG, an emoji, your own logo,
            anything React renders. These five are just examples.
          </p>
        </div>

        <div className="lab__row">
          <label>
            <input type="checkbox" checked={pulse} onChange={(e) => setPulse(e.target.checked)} />
            pulse
          </label>
          <label>
            <input type="checkbox" checked={shown} onChange={(e) => setShown(e.target.checked)} />
            mounted
          </label>
        </div>

        <p className="lab__note">
          It is a real launcher, fixed to the viewport — look at the{" "}
          <b>{position.replace("-", " ")}</b> of your screen. Clicking it calls{" "}
          <code>start(flowId)</code> and runs whichever scenario is selected above, currently{" "}
          <b>{scenario.label.toLowerCase()}</b>. It hides itself while a tour is running, so it
          never floats over its own spotlight.
        </p>
      </div>

      <Snippet code={code} file="app/library.tsx" max={220} />

      {shown && (
        <TourLauncher
          flowId="playground"
          label="Watch guide"
          position={position}
          pulse={pulse}
          icon={icon.node ?? undefined}
        />
      )}
    </div>
  );
}
