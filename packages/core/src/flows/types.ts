import type { RegisteredAnchor, RegisteredEvent, RegisteredFlowId } from "../register";

export type Placement =
  | "top" | "bottom" | "left" | "right"
  | "top-start" | "top-end" | "bottom-start" | "bottom-end"
  | "left-start" | "left-end" | "right-start" | "right-end";

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
  onEnter?: () => void | Promise<void>;

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
  onExit?: (direction: "forward" | "back") => void | Promise<void>;
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
  steps: TourStep[];
};

export type TourExitReason = "completed" | "skipped" | "anchor-missing";
