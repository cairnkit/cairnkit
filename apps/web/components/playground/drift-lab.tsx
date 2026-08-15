"use client";

import { useState } from "react";
import { Snippet } from "@/components/ui/snippet";

/**
 * The three layers, with the output each one actually produces.
 *
 * The playground could show a tour working and stop there, which is the easy
 * half. What sells this library is what happens when the UI moves underneath
 * a tour — so that has to be demonstrable too, not just asserted.
 *
 * Every snippet below is copied from a real run in this repository.
 */
const LAYERS = [
  {
    id: "types",
    label: "TypeScript",
    when: "While you type",
    catches: "A renamed or misspelled anchor, flow id, event or action name.",
    how: "Anchors are declared once and registered, so every id in the API narrows to your own literals. There is no string to get wrong.",
    file: "Terminal",
    code: `$ tsc --noEmit

src/cairn/flows.ts(45,44): error TS2345: Argument of type
  '"invite:close-setings"' is not assignable to parameter of type
  '"invite:close-settings"'.`,
  },
  {
    id: "check",
    label: "cairnkit check",
    when: "In CI, in about 0.1s",
    catches: "An anchor that still exists in the registry but is no longer applied to any element.",
    how: "A static scan of your source. It knows which anchors are declared, which are applied, and which flow breaks when one goes missing.",
    file: "Terminal",
    code: `$ npx cairnkit check src

✗ cairnkit check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - invite.settings-panel  (breaks "invite-candidate")  src/cairn/flows.ts:33
      Spread {...anchor(...)} on the element, or remove the anchor
      and the step pointing at it.`,
  },
  {
    id: "audit",
    label: "Browser audit",
    when: "In CI, against a running app",
    catches:
      "An anchor that exists in source and passes the static check, but never renders — behind a feature flag, an empty state, or a conditional that no longer fires.",
    how: "Drives each flow in a real browser and asserts every step spotlights something. Neither the compiler nor a static scan can see this.",
    file: "tests/walkthrough.spec.ts",
    code: `import { auditFlows } from "@cairnkit/cli";
import { inviteFlow, questionsFlow } from "../src/walkthrough/flows";

test("every step of every flow spotlights something", async ({ page }) => {
  await auditFlows(page, [
    { url: BASE, flow: inviteFlow },
    { url: \`\${BASE}/questions\`, flow: questionsFlow },
  ]);
});`,
  },
] as const;

export function DriftLab() {
  const [active, setActive] = useState(0);
  const layer = LAYERS[active];

  return (
    <div className="drift">
      <div className="drift__rail" role="tablist" aria-label="Drift defence layer">
        {LAYERS.map((entry, index) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={index === active}
            className={`drift__step${index === active ? " drift__step--on" : ""}`}
            onClick={() => setActive(index)}
          >
            <span className="drift__n">{index + 1}</span>
            <span className="drift__label">
              <b>{entry.label}</b>
              <em>{entry.when}</em>
            </span>
          </button>
        ))}
      </div>

      <div className="drift__panel">
        <p className="drift__catches">
          <span>Catches</span>
          {layer.catches}
        </p>
        <p className="drift__how">{layer.how}</p>
        <Snippet code={layer.code} file={layer.file} max={280} />
      </div>
    </div>
  );
}
