import { defineAnchors } from "@cairnkit/core";

/** The page tours itself, so its own anchors are declared here. */
export const anchors = defineAnchors({
  site: {
    install: "site.install",
    failure: "site.failure",
    steps: "site.steps",
    offpath: "site.offpath",
    comparison: "site.comparison",
    packages: "site.packages",
  },
  /** Targets inside the playground's fake product UI. */
  demo: {
    nav: "demo.nav",
    create: "demo.create",
    settings: "demo.settings",
    panel: "demo.panel",
    save: "demo.save",
  },
});
