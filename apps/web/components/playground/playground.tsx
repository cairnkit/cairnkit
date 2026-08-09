"use client";

import { useMemo } from "react";
import type { Placement } from "@cairnkit/core";
import { useTour } from "@cairnkit/react";
import { DemoApp } from "./demo-app";
import { usePlayground } from "./playground-root";
import { SCENARIOS, buildCode, type Config, type ScenarioId } from "./scenarios";
import { Snippet } from "@/components/ui/snippet";

const PLACEMENTS: Placement[] = ["top", "bottom", "left", "right"];

export function PlaygroundStage() {
  const { config, set, settingsOpen, setSettingsOpen } = usePlayground();
  const code = useMemo(() => buildCode(config), [config]);

  return (
    <div className="pg">
      {/* One instrument, not three cards floating near each other: a toolbar
          that owns the run controls, the stage under it, the source below,
          and the inspector docked to the side. */}
      <div className="wb">
        <div className="wb__bar">
          <ScenarioTabs
            active={config.scenario}
            onPick={(scenario) => {
              setSettingsOpen(false);
              set("scenario", scenario);
            }}
          />
          <Runner onReset={() => setSettingsOpen(false)} />
        </div>

        <div className="wb__stage">
          <DemoApp
            settingsOpen={settingsOpen}
            onSettingsOpen={() => setSettingsOpen(true)}
            onSettingsClose={() => setSettingsOpen(false)}
          />
        </div>

        <div className="wb__source">
          <Snippet code={code} file="walkthrough/flows.ts" max={280} />
        </div>
      </div>

      <aside className="insp">
        <Controls config={config} set={set} />
      </aside>
    </div>
  );
}

function ScenarioTabs({
  active,
  onPick,
}: {
  active: ScenarioId;
  onPick: (id: ScenarioId) => void;
}) {
  // Switching scenario swaps the flow underneath a running tour, which leaves
  // it pointing at steps that no longer exist. Stop first.
  const { stop } = useTour();

  return (
    <div className="wb__tabs" role="tablist" aria-label="Scenario">
      {SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          role="tab"
          aria-selected={active === scenario.id}
          title={scenario.blurb}
          className={`wb__tab${active === scenario.id ? " wb__tab--on" : ""}`}
          onClick={() => {
            stop();
            onPick(scenario.id);
          }}
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
}

function Runner({ onReset }: { onReset: () => void }) {
  const { start, stop, stepIndex, flow, step } = useTour();
  const running = Boolean(flow);

  return (
    <div className="wb__run">
      <span className={`wb__status${running ? " wb__status--live" : ""}`}>
        <i />
        {running ? `${stepIndex + 1}/${flow!.steps.length}` : "idle"}
        {running && <em>{String(step?.anchor)}</em>}
      </span>
      {running && (
        <button
          className="wb__ghost"
          onClick={() => {
            stop();
            onReset();
          }}
        >
          Stop
        </button>
      )}
      <button
        className="wb__go"
        onClick={() => {
          onReset();
          start("playground");
        }}
      >
        {running ? "Restart" : "Run tour"}
      </button>
    </div>
  );
}

function Controls({
  config,
  set,
}: {
  config: Config;
  set: <K extends keyof Config>(key: K, value: Config[K]) => void;
}) {
  const index = PLACEMENTS.indexOf(config.placement);

  return (
    <>
      <div className="insp__head">Step options</div>

      <div className="insp__row">
        <div className="insp__top">
          <label>placement</label>
        </div>
        {/* The indicator slides to the active segment; `--i` drives it so the
            movement is CSS rather than a second piece of state. */}
        <div
          className="insp__seg"
          style={{ ["--i" as string]: index }}
          role="radiogroup"
          aria-label="placement"
        >
          {PLACEMENTS.map((placement) => (
            <button
              key={placement}
              role="radio"
              aria-checked={config.placement === placement}
              className={config.placement === placement ? "on" : undefined}
              onClick={() => set("placement", placement)}
            >
              {placement}
            </button>
          ))}
        </div>
      </div>

      <div className="insp__row">
        <div className="insp__top">
          <label htmlFor="pg-padding">padding</label>
          <span className="insp__val">{config.padding}px</span>
        </div>
        <input
          id="pg-padding"
          className="insp__range"
          type="range"
          min={0}
          max={24}
          value={config.padding}
          onChange={(event) => set("padding", Number(event.target.value))}
        />
      </div>

      <div className="insp__row">
        <div className="insp__top" style={{ marginBottom: 0 }}>
          <span className="insp__lbl">beacon</span>
          {/* A label, not a span: the input is visually hidden under the
              track, so only a label makes the track itself clickable. */}
          <label className="insp__switch" htmlFor="pg-beacon">
            <input
              id="pg-beacon"
              type="checkbox"
              checked={config.beacon}
              onChange={(event) => set("beacon", event.target.checked)}
            />
            <span />
          </label>
        </div>
      </div>

      <p className="insp__note">
        Plain fields on a step object. There is no playground-only API, and no runtime config to
        learn.
      </p>
    </>
  );
}
