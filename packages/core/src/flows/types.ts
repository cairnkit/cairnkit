import type { RegisteredAction } from "../register";
import type { RegisteredAnchor, RegisteredEvent, RegisteredFlowId } from "../register";

/**
 * Handed to `onEnter` and `onExit`.
 *
 * Steps are data in a flow file, so a hook cannot close over the state it
 * needs to change. `run` calls an action a mounted component published with
 * `useTourAction` — that is how a step reaches the setter that closes a modal.
 */
export type StepContext = {
  run: (name: RegisteredAction) => Promise<void>;
};

export type Placement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

/**
 * How a step hands control to the next.
 *
 * `next`      user presses Next — explanatory steps
 * `click`     user operates the spotlit element itself
 * `route`     pathname matches — the step's action navigates
 * `event`     app calls emitTourEvent — async success (save, send)
 * `condition` another anchor appears — conditional branches
 */
export type AdvanceRule =
  | { type: "next" }
  | { type: "click" }
  | { type: "route"; pathname: string }
  | { type: "event"; name: RegisteredEvent }
  | { type: "condition"; awaitAnchor: RegisteredAnchor };

export type TourStep = {
  anchor: RegisteredAnchor;
  /** Used instead of `anchor` below the mobile breakpoint. */
  mobileAnchor?: RegisteredAnchor;
  title?: string;
  body?: string;
  /** Resolved through the host's `translate` when copy lives in an i18n catalogue. */
  titleKey?: string;
  bodyKey?: string;
  placement?: Placement;
  /** Defaults to `{ type: "next" }`. */
  advanceOn?: AdvanceRule;
  /** Skip silently when the anchor never resolves, rather than ending the tour. */
  optional?: boolean;
  /** How long to wait for a missing anchor before giving up. Default 4000ms. */
  waitForMs?: number;
  /** Spotlight padding around the target rect. Default 8px. */
  padding?: number;
  /** Pulsing dot on the target. Defaults on for `click` steps. */
  beacon?: boolean;

  /**
   * Runs when this step becomes active.
   *
   * For putting the app into the state the step describes — but not for doing
   * the user's work. A tour that clicks the button teaches nothing.
   */
  onEnter?: (ctx: StepContext) => void | Promise<void>;

  /**
   * Runs when leaving this step, before the next one is measured.
   *
   * The case this exists for: a step anchored inside a modal. Pressing Next
   * leaves the modal open, so the next target sits behind it and the spotlight
   * lands on something the user cannot reach. Closing it here is cleanup, not
   * driving.
   *
   * Await it if the close is animated — the next step measures its target as
   * soon as this resolves, and a rect read mid-transition is the wrong rect.
   *
   * Not called on skip: the tour is over and the user has taken control.
   */
  onExit?: (direction: "forward" | "back", ctx: StepContext) => void | Promise<void>;
};

export type TourFlow = {
  id: RegisteredFlowId;
  /** Bump when steps are added, removed or reordered — invalidates saved progress. */
  version: number;
  /** Where the flow begins. Launching elsewhere navigates here first. */
  entryRoute: string;
  /**
   * Routes this flow does not cover. The tour goes dormant rather than ending:
   * returning to a covered route resumes on the same step, so exploring a side
   * path costs the user nothing.
   */
  pauseRoutes?: string[];
  /**
   * Where to pick up when the user navigates ahead of the guide — they click
   * the button a step before it is described. Only ever applied forwards.
   */
  resumeAt?: { pathname: string; stepIndex: number }[];
  /**
   * Routes belonging to a different guide. Landing on one switches flows, so a
   * legitimate alternative route to the same goal keeps the user guided.
   * Checked before `pauseRoutes`.
   */
  handoffRoutes?: { pathname: string; flowId: RegisteredFlowId }[];
  /**
   * The part of a screen this flow belongs to, when a pathname is too coarse
   * to say — tabs, wizard stages, a split pane. Two guides, one URL.
   *
   * The app declares which part is in front with `useTourScope`. A flow whose
   * scope is not in front goes dormant, exactly as `pauseRoutes` does for a
   * route it does not cover. Leave it unset and nothing changes.
   *
   * Cairn cannot work this out for itself. Anchors are routinely shared across
   * parts — one panel component reused by two tabs — so "my anchor is still
   * on the page" is no evidence of being in the right place. Acting on it
   * yields a guide that confidently describes the wrong feature, which is
   * worse than one that stops.
   */
  scope?: string;
  steps: TourStep[];
};

export type TourExitReason = "completed" | "skipped" | "anchor-missing";

/**
 * How a tour was ended by the person taking it.
 *
 * Three controls end a tour and they do not mean the same thing, so recording
 * one value for all of them throws away the most actionable signal a guide
 * produces:
 *
 *   skipped   the Skip button. A rejection — "I do not want this tour".
 *
 *   closed    the X on the card. Often not rejection at all, but "move this
 *             box, it is covering the thing I am trying to look at" — which is
 *             a placement bug in the step, not a reason to cut it.
 *
 *   escape    the Escape key. Reflex, and frequently accidental.
 *
 * The distinction matters because the fixes are opposite. A step people skip
 * should probably be removed; a step people close is probably sitting on top of
 * its own anchor, and removing it would be the wrong response to a real bug.
 *
 * Separate from `TourExitReason`, which describes how a *flow* ended including
 * outcomes nobody chose. This one is only ever a deliberate act.
 */
export type TourDismissReason = "skipped" | "closed" | "escape";
