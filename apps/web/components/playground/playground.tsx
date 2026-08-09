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
      <div className="pg__stage">
        <ScenarioTabs
          active={config.scenario}
          onPick={(scenario) => {
            setSettingsOpen(false);
            set("scenario", scenario);
          }}
        />
        <DemoApp
          settingsOpen={settingsOpen}
          onSettingsOpen={() => setSettingsOpen(true)}
          onSettingsClose={() => setSettingsOpen(false)}
        />
        <Runner onReset={() => setSettingsOpen(false)} />
      </div>

      <div className="pg__panel">
        <Controls config={config} set={set} />
        <Snippet code={code} file="walkthrough/flows.ts" max={430} />
      </div>
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
    <div className="pg__tabs" role="tablist" aria-label="Scenario">
      {SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          role="tab"
          aria-selected={active === scenario.id}
          className={`pg__tab${active === scenario.id ? " pg__tab--on" : ""}`}
          onClick={() => {
            stop();
            onPick(scenario.id);
          }}
        >
          <b>{scenario.label}</b>
          <span>{scenario.blurb}</span>
        </button>
      ))}
    </div>
  );
}

function Runner({ onReset }: { onReset: () => void }) {
  const { start, stop, stepIndex, flow, step } = useTour();
  const running = Boolean(flow);

  return (
    <div className="pg__run">
      <button
        className="btn btn--primary"
        onClick={() => {
          onReset();
          start("playground");
        }}
      >
        {running ? "Restart tour" : "Run the tour"}
      </button>
      {running && (
        <button
          className="btn btn--ghost"
          onClick={() => {
            stop();
            onReset();
          }}
        >
          Stop
        </button>
      )}
      <span className="pg__state">
        {running
          ? `Step ${stepIndex + 1} of ${flow!.steps.length} · ${String(step?.anchor)}`
          : "Idle"}
      </span>
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
  return (
    <div className="pg__controls">
      <h3 className="pg__h">Step options</h3>

      <div className="pg__ctl">
        <label htmlFor="pg-placement">placement</label>
        <div className="pg__seg" id="pg-placement">
          {PLACEMENTS.map((placement) => (
            <button
              key={placement}
              className={`pg__segbtn${config.placement === placement ? " pg__segbtn--on" : ""}`}
              onClick={() => set("placement", placement)}
            >
              {placement}
            </button>
          ))}
        </div>
      </div>

      <div className="pg__ctl">
        <label htmlFor="pg-padding">
          padding <code>{config.padding}px</code>
        </label>
        <input
          id="pg-padding"
          type="range"
          min={0}
          max={24}
          value={config.padding}
          onChange={(event) => set("padding", Number(event.target.value))}
        />
      </div>

      <div className="pg__ctl pg__ctl--row">
        <label htmlFor="pg-beacon">beacon</label>
        <input
          id="pg-beacon"
          type="checkbox"
          checked={config.beacon}
          onChange={(event) => set("beacon", event.target.checked)}
        />
      </div>

      <p className="pg__hint">
        Changes apply to the next run. Everything here is a plain field on a step object — there
        is no playground-only API.
      </p>
    </div>
  );
}
