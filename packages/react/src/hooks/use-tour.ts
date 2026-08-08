"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ADVANCE,
  bindAdvanceRule,
  decideForRoute,
  defaultsToBeacon,
  getFlow,
  showsNextButton,
  type RegisteredFlowId,
} from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";
import { useAnchorTarget } from "./use-anchor-target";
import { useTourState } from "./use-cairn-store";

/**
 * Drives the active tour: resolves the current step's anchor, decides when the
 * step is satisfied, and handles routes the flow does not cover.
 */
export function useTour() {
  const { store, flows, router, onEvent, onNotice, mobileBreakpoint } = useCairn();
  const pathname = router.usePathname();

  const activeFlowId = useTourState((state) => state.activeFlowId);
  const stepIndex = useTourState((state) => state.stepIndex);

  const flow = getFlow(flows, activeFlowId);
  const step = flow?.steps[stepIndex] ?? null;
  const isLastStep = Boolean(flow && stepIndex >= flow.steps.length - 1);
  const rule = step?.advanceOn ?? DEFAULT_ADVANCE;

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

  const decision = useMemo(
    () => (flow ? decideForRoute(flow, pathname, stepIndex) : { kind: "none" as const }),
    [flow, pathname, stepIndex],
  );

  const isPaused = decision.kind === "pause" || decision.kind === "handoff";
  const anchorId = step ? (isMobile && step.mobileAnchor ? step.mobileAnchor : step.anchor) : null;

  const { element, rect, status, statusFor } = useAnchorTarget(anchorId, {
    waitForMs: step?.waitForMs,
    // Never hunt for anchors that cannot exist here.
    enabled: Boolean(step) && !isPaused,
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
        .then(() => step.onExit?.(direction))
        .catch((error) => console.error("[cairn] onExit threw; continuing anyway.", error))
        .finally(move);
    },
    [step],
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

  const skip = useCallback(() => {
    if (!flow) return;
    store.dismiss(flow.id, flow.version, stepIndex);
  }, [flow, stepIndex, store]);

  /**
   * Starts a flow, navigating to its entry route first when needed.
   *
   * Steps wait for their anchor, so starting before the route settles is safe —
   * and doing the navigation here means every launcher gets it for free.
   */
  const start = useCallback(
    (flowId: RegisteredFlowId) => {
      const target = getFlow(flows, flowId);
      if (!target) return;

      if (pathname !== target.entryRoute) router.navigate(target.entryRoute);
      store.start(flowId);
      onEvent?.({ name: "flow_started", props: { flowId, version: target.version } });
    },
    [flows, pathname, router, store, onEvent],
  );

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

  // A step whose anchor never appeared.
  useEffect(() => {
    if (!flow || !step || isPaused || status !== "missing") return;
    if (statusFor !== anchorId) return;

    onEvent?.({
      name: "anchor_missing",
      props: { flowId: flow.id, stepIndex, anchor: String(step.anchor), pathname },
    });

    if (step.optional) {
      advance();
      return;
    }

    // Non-optional and absent: end, but say why. Dying silently reads as a bug.
    onNotice?.({ reason: "anchor-missing", flowId: flow.id, stepIndex });
    store.dismiss(flow.id, flow.version, stepIndex);
  }, [status, statusFor, anchorId, step, flow, stepIndex, isPaused, pathname, advance, store, onEvent, onNotice]);

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
      .then(() => step.onEnter?.())
      .catch((error) => console.error("[cairn] onEnter threw; continuing anyway.", error));
  }, [flow, step, stepIndex, isPaused]);

  useEffect(() => {
    if (!step || isPaused) return;
    onEvent?.({
      name: "step_viewed",
      props: { flowId: flow!.id, stepIndex, anchor: String(step.anchor) },
    });
  }, [step, stepIndex, flow, isPaused, onEvent]);

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
    showNext: showsNextButton(rule),
    showBeacon: step?.beacon ?? defaultsToBeacon(rule),
    advance,
    back,
    skip,
    start,
    stop,
  };
}
