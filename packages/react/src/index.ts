export { CairnProvider, type CairnProviderProps } from "./provider/cairn-provider";
export { useCairn, type CairnContextValue, type CairnNotice } from "./provider/cairn-context";
export { useTour } from "./hooks/use-tour";
export { useActiveTour, type ActiveTour } from "./hooks/use-active-tour";
export { useStartTour } from "./hooks/use-start-tour";
export { useTourScope } from "./hooks/use-tour-scope";
export { useTourDeepLink } from "./hooks/use-tour-deep-link";
export { useTourState } from "./hooks/use-cairn-store";
export { useAnchorTarget, type AnchorStatus } from "./hooks/use-anchor-target";
export { useStepCopy } from "./hooks/use-step-copy";
export { memoryRouter, type RouterAdapter } from "./adapters/router";
export { TourAnchor, type TourAnchorProps } from "./components/tour-anchor";
export { useTourAction } from "./hooks/use-tour-action";

/**
 * Flow authoring, re-exported from `@cairnkit/core`.
 *
 * Installing `@cairnkit/react` on its own used to leave you unable to write a
 * flow at all — `defineFlow` and `anchor` lived only in core, which the docs
 * never told you to install. It worked under npm, which hoists transitive
 * dependencies, and broke under pnpm, which does not.
 *
 * Importing from `@cairnkit/core` directly still works and is unchanged.
 */
export {
  anchor,
  anchorSelector,
  defineAnchors,
  defineFlow,
  type AdvanceRule,
  type AnchorId,
  type AnchorsOf,
  type CairnRegister,
  type Placement,
  type RegisteredAction,
  type RegisteredAnchor,
  type RegisteredEvent,
  type RegisteredFlowId,
  type StepContext,
  type TourAction,
  type TourFlow,
  type TourStep,
} from "@cairnkit/core";
