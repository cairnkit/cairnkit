import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "Flows and steps" };

export default function Page() {
  return (
    <DocPage
      slug="flows"
      toc={[
        { id: "shape", label: "A flow" },
        { id: "advance", label: "The five advance rules" },
        { id: "step", label: "Step options" },
        { id: "versions", label: "Versioning" },
      ]}
    >
      <H2 id="shape">A flow</H2>
      <P>
        Steps are data, not components. Reordering a tour is an array edit, and adding one is a
        single object — no React is written to change a tour.
      </P>
      <Code file="walkthrough/flows.ts">{`import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

export const createQuestions = defineFlow({
  id: "create-questions",
  version: 1,
  entryRoute: "/questions",
  steps: [
    {
      anchor: anchors.questions.tabCreate,
      title: "Start a new question",
      body: "Pick how you want to write it.",
      advanceOn: { type: "click" },
    },
  ],
});`}</Code>

      <H2 id="advance">The five advance rules</H2>
      <P>A step ends when the user has actually done the thing, not when a timer expires.</P>
      <PropsTable
        rows={[
          {
            name: "next",
            type: `{ type: "next" }`,
            description: "User presses Next. The default, for explanatory steps.",
          },
          {
            name: "click",
            type: `{ type: "click" }`,
            description: "User clicks the spotlit element itself.",
          },
          {
            name: "route",
            type: `{ type: "route"; pathname }`,
            description: "The pathname matches. For steps whose action navigates.",
          },
          {
            name: "event",
            type: `{ type: "event"; name }`,
            description: "Your app calls emitTourEvent — for async work like a save.",
          },
          {
            name: "condition",
            type: `{ type: "condition"; awaitAnchor }`,
            description: "Another anchor appears. For conditional branches.",
          },
        ]}
      />
      <Callout kind="note" title="Next disappears on purpose">
        When a step advances on anything other than <C>next</C>, the Next button is hidden. Leaving
        it visible would let the user skip past the action the step is teaching.
      </Callout>

      <H2 id="step">Step options</H2>
      <PropsTable
        rows={[
          {
            name: "anchor",
            type: "RegisteredAnchor",
            required: true,
            description: "The element to spotlight.",
          },
          {
            name: "mobileAnchor",
            type: "RegisteredAnchor",
            description: "Used instead below the mobile breakpoint.",
          },
          { name: "title / body", type: "string", description: "Literal copy." },
          {
            name: "titleKey / bodyKey",
            type: "string",
            description: "Resolved through your translate function instead.",
          },
          {
            name: "placement",
            type: "Placement",
            default: `"bottom"`,
            description: "Where the card sits relative to the target.",
          },
          {
            name: "advanceOn",
            type: "AdvanceRule",
            default: `{ type: "next" }`,
            description: "What satisfies the step.",
          },
          {
            name: "optional",
            type: "boolean",
            default: "false",
            description: "Skip silently if the anchor never appears.",
          },
          {
            name: "waitForMs",
            type: "number",
            default: "4000",
            description: "How long to wait for a missing anchor.",
          },
          {
            name: "padding",
            type: "number",
            default: "8",
            description: "Spotlight padding around the target.",
          },
          {
            name: "beacon",
            type: "boolean",
            description: "Pulsing dot. Defaults on for click steps.",
          },
          {
            name: "onEnter",
            type: "(ctx) => void | Promise<void>",
            description:
              "Runs once when the step becomes active. `ctx.run(name)` calls an action published by useTourAction.",
          },
          {
            name: "onExit",
            type: "(dir, ctx) => void | Promise<void>",
            description:
              "Runs before leaving, in either direction. Awaited, so an animated close finishes before the next step measures.",
          },
        ]}
      />

      <H2 id="versions">Versioning</H2>
      <P>
        Bump <C>version</C> whenever you add, remove or reorder steps. Progress is persisted, and
        the version is what tells cairnkit a saved step index is no longer meaningful.
      </P>
    </DocPage>
  );
}
