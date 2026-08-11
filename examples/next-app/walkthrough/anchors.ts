import { defineAnchors } from "@cairnkit/core";

/**
 * Every element a guide in this app can point at.
 * Renaming a key breaks the flow file at compile time; deleting the element
 * breaks `cairn check` in CI.
 */
export const anchors = defineAnchors({
  nav: { library: "nav.library" },
  library: {
    tabs: "library.tabs",
    manualCard: "library.manual-card",
    manualCta: "library.manual-cta",
    aiCard: "library.ai-card",
    list: "library.list",
    settingsButton: "library.settings-button",
  },
  settings: { difficulty: "settings.difficulty", save: "settings.save" },
  form: { title: "form.title", body: "form.body", submit: "form.submit" },
  ai: { prompt: "ai.prompt", generate: "ai.generate" },
  /**
   * A tabbed page: two guides, one URL. `tabs` belongs to neither panel and
   * never unmounts, so nothing in the DOM says which guide is being looked at.
   * The app declares that with `useTourScope`.
   */
  prefs: {
    tabs: "prefs.tabs",
    general: "prefs.general",
    sharing: "prefs.sharing",
  },
});
