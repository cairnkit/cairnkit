"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { useStepCopy, useTour } from "@cairnkit/react";
import { Spotlight } from "./spotlight";
import { StepCard, type StepCardLabels } from "./step-card";
import { useOverlayContainer } from "../lib/use-overlay-container";

/** Arrow is a rotated square, so its corner reaches half the diagonal. */
const ARROW_SIZE = 14;
const ARROW_REACH = Math.round((ARROW_SIZE * Math.SQRT2) / 2);
const SPOTLIGHT_PADDING = 8;
const RING = 2;
const GAP = 4;

const DEFAULT_LABELS: StepCardLabels = {
  next: "Next",
  back: "Back",
  skip: "Skip",
  // Distinct from `skip`, which the X used to borrow — leaving two controls
  // announcing the same name to a screen reader.
  close: "Close",
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [isSheet, setIsSheet] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  /**
   * Where our own root actually sits.
   *
   * `.cairn-root` is `position: fixed; inset: 0`, so normally its box *is* the
   * viewport and target rects — which come from `getBoundingClientRect`, i.e.
   * viewport space — can be used directly.
   *
   * Not so once we portal into a dialog. Any ancestor with `transform`,
   * `filter`, `backdrop-filter`, `perspective`, `contain` or `will-change`
   * becomes the containing block for fixed descendants, so the root shrinks to
   * that element and every coordinate is off by its origin. Drawers hit this
   * every time, because sliding one in means transforming it.
   *
   * Measuring the root and subtracting its origin is correct in both cases: it
   * is (0, 0) when the containing block really is the viewport.
   */
  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const measure = () => {
      const box = node.getBoundingClientRect();
      setOrigin((prev) =>
        prev.x === box.left && prev.y === box.top ? prev : { x: box.left, y: box.top },
      );
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [container, tour.rect]);

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

  // Esc leaves the tour, recorded under its own reason: it is the one exit
  // that is frequently accidental, so counting it as a deliberate skip would
  // overstate how many people actually rejected the tour.
  useEffect(() => {
    if (!tour.step || tour.isPaused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") tour.skip("escape");
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
          x: r.left,
          y: r.top,
          width: r.width,
          height: r.height,
          top: r.top,
          left: r.left,
          right: r.left + r.width,
          bottom: r.top + r.height,
        };
      },
    };

    const update = () => {
      void computePosition(reference, card, {
        placement: tour.step?.placement ?? "bottom",
        strategy: "fixed",
        middleware: [
          // Clear the spotlight rather than poke into it. The cutout extends
          // `padding` beyond the target plus a 2px ring, and the arrow's rotated
          // corner reaches half its diagonal past the card edge — so a fixed
          // offset put the tip 4.5px inside the ring at default padding, and
          // further in whenever a step raised it.
          offset((tour.step?.padding ?? SPOTLIGHT_PADDING) + RING + ARROW_REACH + GAP),
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
          requestAnimationFrame(() => {
            card.dataset.placed = "true";
          });
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
          [opposite]: `-${ARROW_SIZE / 2}px`,
        });
        arrowEl.dataset.side = side;
      });
    };

    update();
    return autoUpdate(card as unknown as HTMLElement, card, update);
    // `container` is load-bearing: portaling into a dialog gives React a *new*
    // card element. Without it in the deps the effect never re-runs, the fresh
    // node keeps its default position, and the card lands at the viewport
    // origin while the spotlight still highlights correctly.
  }, [tour.rect, tour.step, isSheet, container]);

  // Dropping the flag on teardown means the next tour opens without a slide.
  useEffect(
    () => () => {
      if (cardRef.current) delete cardRef.current.dataset.placed;
    },
    [],
  );

  if (!container || !tour.flow || !tour.step || tour.isPaused) return null;

  return createPortal(
    <div className="cairn-root" ref={rootRef}>
      <Spotlight
        rect={tour.rect}
        origin={origin}
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
          showBack={tour.showBack}
          isLastStep={tour.isLastStep}
          isSheet={isSheet}
          labels={{ ...DEFAULT_LABELS, ...labels }}
          onNext={tour.advance}
          onBack={tour.back}
          /* Three controls, three reasons. Skip rejects the tour; the X
             usually means the card is covering what they wanted to see. */
          onSkip={() => tour.skip("skipped")}
          onClose={() => tour.skip("closed")}
        />
      </div>
    </div>,
    container,
  );
}
