// Anchors
export { defineAnchors, type AnchorsOf } from "./anchors/define-anchors";
export { anchor, anchorSelector } from "./anchors/anchor";
export { resolveAnchor } from "./anchors/resolve-anchor";
export { ANCHOR_ATTRIBUTE, ANCHOR_PASSTHROUGH, type AnchorId } from "./anchors/types";
export type {
  CairnRegister,
  RegisteredAction,
  RegisteredAnchor,
  RegisteredEvent,
  RegisteredFlowId,
} from "./register";

// Flows
export { defineFlow } from "./flows/define-flow";
export { createFlowRegistry, getFlow, type FlowRegistry } from "./flows/registry";
export { resolveResumeStep } from "./flows/resume";
export type {
  AdvanceRule,
  Placement,
  StepContext,
  TourDismissReason,
  TourExitReason,
  TourFlow,
  TourStep,
} from "./flows/types";

// Engine
export { createTourStore, localStoragePersist } from "./engine/store";
export { decideForRoute, type RouteDecision } from "./engine/lifecycle";
export { createActionRegistry, type ActionRegistry, type TourAction } from "./engine/actions";
export { devWarn } from "./internal/dev";
export {
  DEFAULT_ADVANCE,
  bindAdvanceRule,
  defaultsToBeacon,
  showsNextButton,
} from "./engine/advance-rules";
export type { PersistAdapter, TourState, TourStore } from "./engine/types";

// Events
export { emitTourEvent, onTourEvent } from "./events/emit";
export type { CairnEvent, CairnEventHandler, TourEventName } from "./events/types";

// DOM
export { readRadius, readRect, rectsEqual, type TargetRect } from "./dom/rect";
export { watchForAnchor, type WatchResult } from "./dom/observe-element";
export { prefersReducedMotion, scrollAnchorIntoView } from "./dom/scroll-into-view";
