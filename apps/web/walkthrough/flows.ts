import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

/**
 * A real cairnkit tour, of the page describing cairnkit.
 *
 * Better than a video: it is the actual library, running the actual engine,
 * imported from the workspace — so it can never drift from what ships.
 */
export const tourOfThisPage = defineFlow({
  id: "tour-of-this-page",
  version: 1,
  entryRoute: "/",
  steps: [
    {
      anchor: anchors.site.install,
      title: "This is a real cairnkit tour",
      body: "Not a video. The same engine you would install, running on this page.",
      placement: "bottom",
    },
    {
      anchor: anchors.site.failure,
      title: "The part that matters",
      body: "Delete an element a tour points at and the build fails — before a user ever sees it.",
      placement: "bottom",
    },
    {
      anchor: anchors.site.steps,
      title: "Four steps to adopt",
      body: "Declare anchors, mark elements, write the flow, mount it.",
      placement: "top",
    },
    {
      anchor: anchors.site.comparison,
      title: "Why not a CSS selector",
      body: "Every other tool targets by selector, so a rename breaks it silently.",
      placement: "top",
    },
    {
      anchor: anchors.site.packages,
      title: "Small, and mostly optional",
      body: "The engine is 2.3 kb with zero dependencies. Take only what you need.",
      placement: "top",
    },
  ],
});

export const flows = [tourOfThisPage];
