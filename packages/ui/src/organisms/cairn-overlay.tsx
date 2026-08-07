"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { useStepCopy, useTour } from "@cairnkit/react";
import { Spotlight } from "./spotlight";
import { StepCard, type StepCardLabels } from "./step-card";
import { useOverlayContainer } from "../lib/use-overlay-container";

const DEFAULT_LABELS: StepCardLabels = {
  next: "Next",
  back: "Back",
  skip: "Skip",
  done: "Done",
  counter: (current, total) => `Step ${current} of ${total}`,
};

export type CairnOverlayProps = {
  labels?: Partial<StepCardLabels>;
  /** Below this width the card becomes a bottom sheet. Default 768. */
  mobileBreakpoint?: number;
  /** Called when the tour ends for a reason the user should understand. */
  onNotice?: (notice: { reason: "anchor-missing" | "paused"; flowId: string }) => void;
};

/**
 * The prebuilt overlay. Reads everything from `useTour()`, so replacing it with
 * your own components is a matter of not rendering this one.
 */
export function CairnOverlay({ labels, mobileBreakpoint = 768, onNotice }: CairnOverlayProps) {
  const tour = useTour();
  const { title, body } = useStepCopy(tour.flow, tour.step);
  const container = useOverlayContainer(tour.element ?? null);

  const cardRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const [isSheet, setIsSheet] = useState(false);

  useEffect(() => {
    // jsdom has no matchMedia. A library must not take down a consumer's test
    // suite for a progressive enhancement — fall back to the desktop layout.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const update = () => setIsSheet(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [mobileBreakpoint]);

  // Esc leaves the tour.
  useEffect(() => {
    if (!tour.step || tour.isPaused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") tour.skip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tour]);

  useEffect(() => {
    if (tour.isPaused && tour.flow) onNotice?.({ reason: "paused", flowId: tour.flow.id });
  }, [tour.isPaused, tour.flow, onNotice]);

  // Position the card against the tracked rect, tooltip-style: an arrow points
  // back at the target so the card reads as attached to it rather than
  // floating near it. A virtual reference keeps this correct even while the
  // real element is being swapped between steps.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !tour.rect || isSheet) return;

    const reference = {
      getBoundingClientRect: () => {
        const r = tour.rect!;
        return {
          x: r.left, y: r.top, width: r.width, height: r.height,
          top: r.top, left: r.left, right: r.left + r.width, bottom: r.top + r.height,
        };
      },
    };

    const update = () => {
      void computePosition(reference, card, {
        placement: tour.step?.placement ?? "bottom",
        strategy: "fixed",
        middleware: [
          offset(14),
          flip({ padding: 12 }),
          shift({ padding: 12 }),
          arrowRef.current ? arrow({ element: arrowRef.current }) : undefined,
        ].filter(Boolean) as never,
      }).then(({ x, y, placement, middlewareData }) => {
        Object.assign(card.style, { position: "fixed", left: `${x}px`, top: `${y}px` });

        // Glide between steps rather than teleport — but only once we have
        // placed it. Transitioning the first placement would fly the card in
        // from the top-left corner.
        if (!card.dataset.placed) {
          requestAnimationFrame(() => { card.dataset.placed = "true"; });
        }

        const arrowEl = arrowRef.current;
        const arrowData = middlewareData.arrow;
        if (!arrowEl || !arrowData) return;

        // The arrow sits on the face pointing back at the target, offset by
        // half its diagonal so the rotated square meets the card edge cleanly.
        const side = placement.split("-")[0] as "top" | "bottom" | "left" | "right";
        const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];

        Object.assign(arrowEl.style, {
          left: arrowData.x != null ? `${arrowData.x}px` : "",
          top: arrowData.y != null ? `${arrowData.y}px` : "",
          right: "",
          bottom: "",
          [opposite]: "-6px",
        });
        arrowEl.dataset.side = side;
      });
    };

    update();
    return autoUpdate(card as unknown as HTMLElement, card, update);
  }, [tour.rect, tour.step, isSheet]);

  // Dropping the flag on teardown means the next tour opens without a slide.
  useEffect(() => () => {
    if (cardRef.current) delete cardRef.current.dataset.placed;
  }, []);

  if (!container || !tour.flow || !tour.step || tour.isPaused) return null;

  return createPortal(
    <div className="cairn-root">
      <Spotlight
        rect={tour.rect}
        anchorKey={String(tour.step.anchor)}
        padding={tour.step.padding}
        beacon={tour.showBeacon}
      />
      <div
        ref={cardRef}
        className="cairn-anchorbox"
        style={isSheet ? { position: "fixed", left: 0, right: 0, bottom: 0 } : undefined}
      >
        {!isSheet && <div ref={arrowRef} className="cairn-arrow" aria-hidden />}
        <StepCard
          title={title}
          body={body}
          stepNumber={tour.stepIndex + 1}
          totalSteps={tour.flow.steps.length}
          showNext={tour.showNext}
          isLastStep={tour.isLastStep}
          isSheet={isSheet}
          labels={{ ...DEFAULT_LABELS, ...labels }}
          onNext={tour.advance}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      </div>
    </div>,
    container,
  );
}
