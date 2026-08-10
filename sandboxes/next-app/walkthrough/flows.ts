import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

export const LIBRARY = "/";
export const FORM = "/new";
export const AI = "/ai";

/** The manual path, including a step that points inside a modal. */
export const manualFlow = defineFlow({
  id: "create-manual",
  version: 1,
  entryRoute: LIBRARY,
  // Choosing the AI generator is a different route to the same goal.
  handoffRoutes: [{ pathname: AI, flowId: "create-ai" }],
  // Users click through before the guide gets there; catch up rather than die.
  resumeAt: [{ pathname: FORM, stepIndex: 5 }],
  steps: [
    { anchor: anchors.nav.library, title: "Your library", body: "Everything you write lives here." },
    { anchor: anchors.library.tabs, title: "Two ways to work", body: "Write one yourself, or let AI draft it." },
    { anchor: anchors.library.settingsButton, title: "Open settings", body: "Click it — the next step is inside the dialog.", advanceOn: { type: "click" } },
    { anchor: anchors.settings.difficulty, title: "Inside a modal", body: "This step points at a control in a dialog, not the page." },
    { anchor: anchors.library.manualCta, title: "Let's write one", body: "Click Create manually.", advanceOn: { type: "route", pathname: FORM } },
    { anchor: anchors.form.title, title: "Name it", body: "A short internal label." },
    { anchor: anchors.form.body, title: "Write the question", body: "The exact wording candidates see." },
    { anchor: anchors.form.submit, title: "Save it", body: "Nothing is stored until you save." },
  ],
});

/** The sibling guide the manual flow hands off to. */
export const aiFlow = defineFlow({
  id: "create-ai",
  version: 1,
  entryRoute: AI,
  handoffRoutes: [{ pathname: FORM, flowId: "create-manual" }],
  pauseRoutes: [LIBRARY],
  steps: [
    { anchor: anchors.ai.prompt, title: "Describe the role", body: "The more specific, the sharper the questions." },
    { anchor: anchors.ai.generate, title: "Generate", body: "You review everything before it is saved." },
  ],
});

export const flows = [manualFlow, aiFlow];
