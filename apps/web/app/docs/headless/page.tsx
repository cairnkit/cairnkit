import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "Headless usage" };

export default function Page() {
  return (
    <DocPage
      slug="headless"
      toc={[
        { id: "when", label: "When to go headless" },
        { id: "usetour", label: "useTour()" },
        { id: "example", label: "A minimal overlay" },
        { id: "pieces", label: "Reusing individual pieces" },
      ]}
    >
      <H2 id="when">When to go headless</H2>
      <P>
        <C>@cairnkit/ui</C> is one opinion about how a tour should look. If you have a design system
        and want the tour to be part of it, drop the package and drive the engine yourself.
      </P>
      <P>
        <C>@cairnkit/react</C> ships no CSS and renders nothing on its own — everything below works
        without <C>ui</C> installed.
      </P>

      <H2 id="usetour">useTour()</H2>
      <PropsTable
        rows={[
          { name: "flow", type: "TourFlow | null", description: "The running flow, or null." },
          { name: "step", type: "TourStep | null", description: "The current step." },
          { name: "stepIndex", type: "number", description: "Zero-based." },
          { name: "element", type: "HTMLElement | null", description: "The resolved DOM node." },
          { name: "rect", type: "TargetRect | null", description: "Live viewport rect, tracked on rAF." },
          { name: "status", type: `"resolving" | "ready" | "missing"`, description: "Anchor resolution state." },
          { name: "isPaused", type: "boolean", description: "On a route this flow does not cover." },
          { name: "isLastStep", type: "boolean", description: "Whether Next should read as Done." },
          { name: "showNext", type: "boolean", description: "False when the step needs a real action." },
          { name: "showBeacon", type: "boolean", description: "Whether to draw the pulsing dot." },
          { name: "advance / back / skip", type: "() => void", description: "Step controls." },
          { name: "start / stop", type: "(flowId?) => void", description: "Start a flow, or end the current one." },
        ]}
      />

      <H2 id="example">A minimal overlay</H2>
      <Code>{`"use client";
import { useTour, useStepCopy } from "@cairnkit/react";

export function MyOverlay() {
  const tour = useTour();
  const { title, body } = useStepCopy(tour.flow, tour.step);

  if (!tour.flow || !tour.step || tour.isPaused) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      {tour.rect && (
        <div
          style={{
            position: "absolute",
            top: tour.rect.top - 8,
            left: tour.rect.left - 8,
            width: tour.rect.width + 16,
            height: tour.rect.height + 16,
            boxShadow: "0 0 0 2px #4f46e5, 0 0 0 9999px rgb(0 0 0 / .6)",
            borderRadius: tour.rect.radius + 4,
          }}
        />
      )}

      <div style={{ pointerEvents: "auto" /* your card */ }}>
        <h2>{title}</h2>
        <p>{body}</p>
        <button onClick={tour.skip}>Skip</button>
        {tour.showNext && <button onClick={tour.advance}>Next</button>}
      </div>
    </div>
  );
}`}</Code>
      <Callout kind="warn" title="Two things to keep">
        Keep the overlay <C>pointer-events: none</C> with only your card set to <C>auto</C> — the
        user must be able to click the real element. And honour <C>showNext</C>, or you let people
        skip the action a step is teaching.
      </Callout>

      <H2 id="pieces">Reusing individual pieces</H2>
      <P>
        <C>@cairnkit/ui</C> also exports its parts, so you can keep the spotlight and replace only
        the card.
      </P>
      <Code>{`import { Spotlight, StepCard, ProgressRail, Launcher } from "@cairnkit/ui";`}</Code>
    </DocPage>
  );
}
