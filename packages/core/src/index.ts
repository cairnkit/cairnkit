// Anchors
export { defineAnchors, type AnchorsOf } from "./anchors/define-anchors";
export { anchor, anchorSelector } from "./anchors/anchor";
export { resolveAnchor } from "./anchors/resolve-anchor";
export { ANCHOR_ATTRIBUTE, type AnchorId } from "./anchors/types";
export type { CairnRegister, RegisteredAnchor, RegisteredFlowId } from "./register";

// Flows
export { defineFlow } from "./flows/define-flow";
export { createFlowRegistry, getFlow, type FlowRegistry } from "./flows/registry";
export { resolveResumeStep } from "./flows/resume";
export type {
  AdvanceRule,
  Placement,
  TourExitReason,
  TourFlow,
  TourStep,
} from "./flows/types";

// Engine
export { createTourStore, localStoragePersist } from "./engine/store";
export { decideForRoute, type RouteDecision } from "./engine/lifecycle";
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
export { readRect, rectsEqual, type TargetRect } from "./dom/rect";
export { watchForAnchor, type WatchResult } from "./dom/observe-element";
export { prefersReducedMotion, scrollAnchorIntoView } from "./dom/scroll-into-view";
