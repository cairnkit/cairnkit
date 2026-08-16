import type { TourDismissReason } from "../flows/types";

/** Signals the host app emits so a step can wait on real work finishing. */
export type TourEventName = string & { readonly __cairnEvent?: unique symbol };

/** Analytics events cairnkit emits outward. One callback, any destination. */
export type CairnEvent =
  | { name: "flow_started"; props: { flowId: string; version: number } }
  | { name: "step_viewed"; props: { flowId: string; stepIndex: number; anchor: string } }
  | { name: "flow_completed"; props: { flowId: string; version: number } }
  /**
   * `reason` is optional so a host reading these events keeps compiling, and
   * so an overlay that has not been updated to say which control was used
   * still emits a valid event rather than none.
   */
  | {
      name: "flow_dismissed";
      props: { flowId: string; version: number; stepIndex: number; reason?: TourDismissReason };
    }
  | { name: "flow_handoff"; props: { fromFlowId: string; toFlowId: string; pathname: string } }
  | {
      name: "anchor_missing";
      props: { flowId: string; stepIndex: number; anchor: string; pathname: string };
    }
  | {
      name: "step_feedback";
      props: { flowId: string; stepIndex: number; clear: boolean; note?: string };
    };

export type CairnEventHandler = (event: CairnEvent) => void;
