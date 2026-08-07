import { defineAnchors } from "@cairnkit/core";

/** The page tours itself, so its own anchors are declared here. */
export const anchors = defineAnchors({
  site: {
    install: "site.install",
    failure: "site.failure",
    steps: "site.steps",
    comparison: "site.comparison",
    packages: "site.packages",
  },
});
