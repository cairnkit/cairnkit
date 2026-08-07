import type { AnchorLeaves } from "./anchors/types";

/**
 * Opt-in type registry.
 *
 * Augment this once in your app and every anchor and flow id across the whole
 * API narrows to your own literals — so a typo fails to compile instead of
 * silently pointing a tour at nothing:
 *
 *   declare module "@cairnkit/core" {
 *     interface CairnRegister {
 *       anchors: typeof anchors;
 *       flowIds: "invite-candidate" | "write-question";
 *     }
 *   }
 *
 * Left un-augmented, both fall back to `string`, so nothing breaks for anyone
 * who would rather not bother. Same pattern next-intl uses for message keys.
 */
export interface CairnRegister {}

/** Anchor ids the app has declared, or any string if it has not registered. */
export type RegisteredAnchor = CairnRegister extends { anchors: infer A }
  ? AnchorLeaves<A> & string
  : string;

/** Flow ids the app has declared, or any string if it has not registered. */
export type RegisteredFlowId = CairnRegister extends { flowIds: infer F }
  ? F & string
  : string;

/**
 * App event names, or any string if unregistered.
 *
 * Worth narrowing: a typo in an event name means a step waits forever for
 * something that never fires — a tour that hangs rather than fails, which is
 * harder to notice than a missing anchor.
 */
export type RegisteredEvent = CairnRegister extends { events: infer E }
  ? E & string
  : string;
