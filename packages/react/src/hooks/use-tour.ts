"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ADVANCE,
  bindAdvanceRule,
  defaultsToBeacon,
  resolveAnchor,
  showsNextButton,
  type StepContext,
  type TourDismissReason,
} from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";
import { useActiveTour } from "./use-active-tour";
import { useAnchorTarget } from "./use-anchor-target";
import { useStartTour } from "./use-start-tour";

/**
 * Drives the active tour: resolves the current step's anchor, decides when the
 * step is satisfied, and handles routes the flow does not cover.
 *
 * Mount this once. Everything here is a side effect — listeners, lifecycle
 * hooks, ending a flow whose anchor never came — so a second copy runs them
 * all twice. Read-only consumers want `useActiveTour` or `useTourState`.
 */
export function useTour() {
  const { store, onEvent, onNotice, mobileBreakpoint, actions } = useCairn();
  const { flow, stepIndex, pathname, decision, isPaused: isOutOfPlace } = useActiveTour();
  const step = flow?.steps[stepIndex] ?? null;
  const isLastStep = Boolean(flow && stepIndex >= flow.steps.length - 1);
  const rule = step?.advanceOn ?? DEFAULT_ADVANCE;

  /**
   * Set when the user navigates away from the page the current step lives on.
   *
   * Distinct from `isOutOfPlace`, which comes from the flow's own declarations
   * and switches off anchor hunting. This one has to keep hunting: returning
   * to the page is exactly what un-sets it.
   */
  const [hasLeftStepRoute, setHasLeftStepRoute] = useState(false);
  const isPaused = isOutOfPlace || hasLeftStepRoute;

  /** What `onEnter` and `onExit` receive. Stable, so it never re-fires them. */
  const stepContext = useMemo<StepContext>(() => ({ run: (name) => actions.run(name) }), [actions]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    // jsdom has no matchMedia. A library must not take down a consumer's test
    // suite for a progressive enhancement — fall back to the desktop layout.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [mobileBreakpoint]);

  const anchorId = step ? (isMobile && step.mobileAnchor ? step.mobileAnchor : step.anchor) : null;

  const { element, rect, status, statusFor, statusAt } = useAnchorTarget(anchorId, {
    waitForMs: step?.waitForMs,
    // Never hunt for anchors that cannot exist here. Keyed on the flow's own
    // declarations only — a step whose page the user merely wandered off keeps
    // hunting, because finding the anchor again is how it wakes up.
    enabled: Boolean(step) && !isOutOfPlace,
    resetKey: pathname,
  });

  /**
   * Runs a step's `onExit`, then moves.
   *
   * Deliberately still `() => void` rather than async. Making it a promise
   * would change the signature of `advance` and `back` for every consumer, to
   * buy an await almost nobody needs — the caller is a click handler. The
   * move is simply deferred until the hook settles.
   *
   * A hook that throws must not strand the user mid-tour, so `finally` moves
   * on either way.
   */
  const leaveStep = useCallback(
    (direction: "forward" | "back", move: () => void) => {
      if (!step?.onExit) {
        move();
        return;
      }

      void Promise.resolve()
        .then(() => step.onExit?.(direction, stepContext))
        .catch((error) => console.error("[cairn] onExit threw; continuing anyway.", error))
        .finally(move);
    },
    [step, stepContext],
  );

  const advance = useCallback(() => {
    if (!flow) return;

    leaveStep("forward", () => {
      if (stepIndex >= flow.steps.length - 1) {
        store.complete(flow.id, flow.version);
        return;
      }
      store.goToStep(stepIndex + 1);
    });
  }, [flow, stepIndex, store, leaveStep]);

  const back = useCallback(() => {
    if (stepIndex === 0) return;
    leaveStep("back", () => store.goToStep(stepIndex - 1));
  }, [stepIndex, store, leaveStep]);

  /**
   * End the tour, recording which control did it.
   *
   * Defaults to `"skipped"` so every existing `tour.skip()` call keeps exactly
   * its current meaning — that call site *is* the Skip button. The X and the
   * Escape key pass their own reason, because they are different acts: closing
   * a card that is covering the thing you are trying to look at is a placement
   * bug in the step, not a rejection of the tour, and the two want opposite
   * fixes.
   */
  const skip = useCallback(
    (reason: TourDismissReason = "skipped") => {
      if (!flow) return;
      store.dismiss(flow.id, flow.version, stepIndex, reason);
    },
    [flow, stepIndex, store],
  );

  const start = useStartTour();
  const stop = useCallback(() => store.stop(), [store]);

  // Route decisions: hand off to another guide, or catch up to a user who
  // clicked ahead. Pausing needs no action — it simply renders nothing.
  useEffect(() => {
    if (!flow) return;

    if (decision.kind === "handoff" && decision.flowId !== flow.id) {
      onEvent?.({
        name: "flow_handoff",
        props: { fromFlowId: flow.id, toFlowId: decision.flowId, pathname },
      });
      onNotice?.({ reason: "handoff", fromFlowId: flow.id, toFlowId: decision.flowId });
      store.start(decision.flowId);
    }

    if (decision.kind === "resume") store.goToStep(decision.stepIndex);
  }, [decision, flow, pathname, store, onEvent, onNotice]);

  /**
   * The pathname each step was on when it became active — the page it lives on.
   *
   * The engine knows which anchor a step points at, never which page that
   * anchor is on, so this is the closest thing to a step's address. It is what
   * separates "the user walked off" from "this app is broken".
   */
  const stepRoute = useRef<{ key: string; pathname: string } | null>(null);

  useEffect(() => {
    if (!flow || !step) {
      stepRoute.current = null;
      return;
    }

    const key = `${flow.id}:${stepIndex}`;
    if (stepRoute.current?.key === key) return;

    stepRoute.current = { key, pathname };
    // A fresh step starts awake, whatever the previous one ended as.
    setHasLeftStepRoute(false);
  }, [flow, step, stepIndex, pathname]);

  // Back on the page, with the anchor found: wake up.
  useEffect(() => {
    if (status === "ready") setHasLeftStepRoute(false);
  }, [status]);

  // A step whose anchor never appeared.
  useEffect(() => {
    if (!flow || !step || isOutOfPlace || status !== "missing") return;
    // Only act on a verdict that describes *this* anchor on *this* route. For
    // one render after a navigation, `status` still holds the previous route's
    // answer — and by then the step's own route may match again, which read as
    // "the element is genuinely gone" and ended a tour that was about to wake.
    if (statusFor !== anchorId || statusAt !== pathname) return;

    /*
     * Still reported when the step is optional, because "this section was never
     * there" is worth knowing: a step that skips for everyone is a step to
     * delete. But it is flagged, because it is not a fault, and a consumer
     * counting these as broken anchors would otherwise report every intended
     * skip as breakage. Only set when true, so nothing already reading this
     * event changes behaviour.
     */
    onEvent?.({
      name: "anchor_missing",
      props: {
        flowId: flow.id,
        stepIndex,
        anchor: String(step.anchor),
        pathname,
        ...(step.optional ? ({ optional: true } as const) : null),
      },
    });

    if (step.optional) {
      advance();
      return;
    }

    /**
     * Missing because they navigated off this step's page — the browser Back
     * button, a link, a redirect. Going dormant keeps their place: the anchor
     * watcher restarts on the next pathname change, so returning picks the
     * tour up exactly where it was. Ending here treated an ordinary move
     * around the app as a fault.
     */
    if (stepRoute.current && stepRoute.current.pathname !== pathname) {
      setHasLeftStepRoute(true);
      return;
    }

    /**
     * Missing on the page it lives on: the element is genuinely gone. End, but
     * say why — dying silently reads as a bug.
     *
     * `stop`, not `dismiss`. Dismissal is a decision the user makes by pressing
     * Skip; this is the app moving out from under a guide that was mid-flight.
     * Recording it as a dismissal put a verdict in persisted state that the
     * user never gave. The `anchor_missing` event above is the honest record.
     */
    onNotice?.({ reason: "anchor-missing", flowId: flow.id, stepIndex });
    store.stop();
  }, [
    status,
    statusFor,
    statusAt,
    anchorId,
    step,
    flow,
    stepIndex,
    isOutOfPlace,
    pathname,
    advance,
    store,
    onEvent,
    onNotice,
  ]);

  // `route` is the one rule the caller owns, because it holds the pathname.
  useEffect(() => {
    if (rule.type !== "route" || isPaused) return;
    if (pathname === rule.pathname) advance();
  }, [rule, pathname, isPaused, advance]);

  useEffect(() => {
    if (isPaused) return;
    return bindAdvanceRule(rule, element, advance);
  }, [rule, element, advance, isPaused]);

  /**
   * Fires `onEnter` once per step entry.
   *
   * Keyed on flow + index rather than the step object, because a flow defined
   * inline gets a fresh object identity on every render and would otherwise
   * run the hook on each one. Clearing the key when the tour stops is what
   * lets a restart re-enter step 0.
   *
   * An effect, so it never runs on the server.
   */
  const enteredKey = useRef<string | null>(null);

  useEffect(() => {
    if (!flow || !step) {
      enteredKey.current = null;
      return;
    }
    if (isPaused) return;

    const key = `${flow.id}:${stepIndex}`;
    if (enteredKey.current === key) return;
    enteredKey.current = key;

    void Promise.resolve()
      .then(() => step.onEnter?.(stepContext))
      .catch((error) => console.error("[cairn] onEnter threw; continuing anyway.", error));
  }, [flow, step, stepIndex, isPaused, stepContext]);

  /**
   * One `step_viewed` per step, however many times the step re-renders.
   *
   * Keyed like `onEnter` above, and for a sharper reason: a step that goes
   * dormant and wakes, or whose flow object changes identity, was emitting the
   * event again each time. Analytics counted that as the user seeing the step
   * twice, which quietly inflates every funnel built on it.
   */
  const viewedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!flow || !step || isPaused) return;

    const key = `${flow.id}:${stepIndex}`;
    if (viewedKey.current === key) return;
    viewedKey.current = key;

    onEvent?.({
      name: "step_viewed",
      props: { flowId: flow.id, stepIndex, anchor: String(step.anchor) },
    });
  }, [step, stepIndex, flow, isPaused, onEvent]);

  /**
   * Whether going back would land anywhere.
   *
   * Across a route boundary it would not: the previous step is anchored to a
   * page the user has left, so Back either stalls on an anchor that is not
   * here or — if the flow has a `resumeAt` for this route — is undone the
   * instant it happens. Both read as a dead button, so it is hidden instead.
   *
   * A previous step with an `onEnter` is exempt. That hook exists to put the
   * app back into the state the step describes, reopening the modal or panel
   * its anchor lives in, so absence right now proves nothing.
   */
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const previous = stepIndex > 0 ? flow?.steps[stepIndex - 1] : undefined;
    if (!previous) {
      setCanGoBack(false);
      return;
    }

    const target = isMobile && previous.mobileAnchor ? previous.mobileAnchor : previous.anchor;
    setCanGoBack(Boolean(previous.onEnter) || resolveAnchor(target) !== null);
  }, [flow, stepIndex, pathname, isMobile]);

  return {
    flow,
    step,
    stepIndex,
    /** The resolved DOM node. Needed to detect a target inside a dialog. */
    element,
    rect,
    status,
    isPaused,
    isLastStep,
    /** False when the previous step is on a page the user has left. */
    showBack: canGoBack,
    showNext: showsNextButton(rule),
    showBeacon: step?.beacon ?? defaultsToBeacon(rule),
    advance,
    back,
    skip,
    start,
    stop,
  };
}
