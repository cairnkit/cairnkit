import { defineFlow, type Placement, type TourFlow } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";

export type ScenarioId = "basic" | "click" | "modal";

export type Config = {
  scenario: ScenarioId;
  placement: Placement;
  padding: number;
  beacon: boolean;
};

export const SCENARIOS: { id: ScenarioId; label: string; blurb: string }[] = [
  { id: "basic", label: "A plain tour", blurb: "Three steps, advanced with the Next button." },
  { id: "click", label: "Wait for a click", blurb: "The step will not move until the user acts." },
  { id: "modal", label: "Inside a modal", blurb: "Opens a dialog, then closes it on the way out." },
];

/**
 * The playground's flows are rebuilt whenever a control changes, which is the
 * whole point — you are editing a real flow object, not a preview of one.
 *
 * `entryRoute` is this page: `memoryRouter` reads the real pathname, and a
 * flow whose entry route never matches would pause itself immediately.
 */
export function buildFlow(config: Config): TourFlow {
  const { placement, padding, beacon } = config;
  const common = { placement, padding, beacon };

  if (config.scenario === "click") {
    return defineFlow({
      id: "playground",
      version: 1,
      entryRoute: "/playground",
      steps: [
        {
          anchor: anchors.demo.create,
          title: "Click it",
          body: "This step has no Next button. It waits for the real click.",
          advanceOn: { type: "click" },
          ...common,
        },
        {
          anchor: anchors.demo.save,
          title: "That advanced it",
          body: "The tour moved because you acted, not because you were told to.",
          ...common,
        },
      ],
    });
  }

  if (config.scenario === "modal") {
    return defineFlow({
      id: "playground",
      version: 1,
      entryRoute: "/playground",
      steps: [
        {
          anchor: anchors.demo.settings,
          title: "Open the settings",
          body: "Click to open the dialog.",
          advanceOn: { type: "click" },
          ...common,
        },
        {
          anchor: anchors.demo.panel,
          title: "A field inside the dialog",
          body: "The card portals into the dialog, so the focus trap does not swallow it.",
          // Arriving backwards from step 3, the dialog is shut — this step is
          // anchored inside it, so it has to be open before we measure.
          onEnter: (ctx) => ctx.run("demo:open-settings"),
          // Every later step is behind this dialog, so it has to close first.
          onExit: (_direction, ctx) => ctx.run("demo:close-settings"),
          ...common,
        },
        {
          anchor: anchors.demo.save,
          title: "And the dialog closed itself",
          body: "Without that, this spotlight would be sitting behind the modal.",
          ...common,
        },
      ],
    });
  }

  return defineFlow({
    id: "playground",
    version: 1,
    entryRoute: "/playground",
    steps: [
      {
        anchor: anchors.demo.nav,
        // The sidebar is hidden on narrow screens, and a hidden element never
        // resolves. Below 768px this step points at the toolbar instead.
        mobileAnchor: anchors.demo.create,
        title: "Start here",
        body: "Anchors are declared once and referenced by name, never by CSS selector.",
        ...common,
      },
      {
        anchor: anchors.demo.create,
        title: "Then here",
        body: "Rename this button and the build fails. The tour cannot drift quietly.",
        ...common,
      },
      {
        anchor: anchors.demo.save,
        title: "Done",
        body: "Three steps, defined as data, living next to the code they describe.",
        ...common,
      },
    ],
  });
}

/** The flow above, printed as the source you would actually write. */
export function buildCode(config: Config): string {
  const { placement, padding, beacon, scenario } = config;

  const opts = [
    `    placement: "${placement}",`,
    `    padding: ${padding},`,
    beacon ? "    beacon: true," : null,
  ]
    .filter(Boolean)
    .join("\n");

  const step = (anchorPath: string, title: string, body: string, extra?: string) =>
    [
      "  {",
      `    anchor: anchors.${anchorPath},`,
      `    title: ${JSON.stringify(title)},`,
      `    body: ${JSON.stringify(body)},`,
      extra ?? null,
      opts,
      "  },",
    ]
      .filter(Boolean)
      .join("\n");

  const steps =
    scenario === "click"
      ? [
          step("demo.create", "Click it", "This step waits for the real click.", '    advanceOn: { type: "click" },'),
          step("demo.save", "That advanced it", "The tour moved because you acted."),
        ]
      : scenario === "modal"
        ? [
            step("demo.settings", "Open the settings", "Click to open the dialog.", '    advanceOn: { type: "click" },'),
            step(
              "demo.panel",
              "A field inside the dialog",
              "The card portals in, so the focus trap does not swallow it.",
              '    onEnter: (ctx) => ctx.run("demo:open-settings"),\n' +
                '    onExit: (_direction, ctx) => ctx.run("demo:close-settings"),',
            ),
            step("demo.save", "And the dialog closed itself", "Otherwise this would sit behind it."),
          ]
        : [
            step("demo.nav", "Start here", "Anchors are referenced by name."),
            step("demo.create", "Then here", "Rename this button and the build fails."),
            step("demo.save", "Done", "Three steps, defined as data."),
          ];

  const hook =
    scenario === "modal"
      ? `// In the component that owns the dialog state:
useTourAction("demo:close-settings", () => setSettingsOpen(false));

`
      : "";

  return `${hook}export const flow = defineFlow({
  id: "playground",
  version: 1,
  entryRoute: "/playground",
  steps: [
${steps.join("\n")}
  ],
});`;
}
