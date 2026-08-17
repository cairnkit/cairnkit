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
  /**
   * An anchor a step wanted was not on the page.
   *
   * `optional` is set only when the step declared itself optional, and it is the
   * difference between a fault and a designed absence. An optional step exists
   * because the thing it points at legitimately may not be there: a panel that
   * renders nothing when it has nothing to say, a section gated on data. Without
   * this flag both arrive as the same event, so a dashboard counting
   * `anchor_missing` reports "broken anchors" every time a guide skips a step
   * exactly as intended, and the number that is supposed to mean "your tour is
   * pointing at UI that is gone" quietly stops meaning it.
   *
   * Absent rather than `false` on a required step, so existing consumers see no
   * change and stored history keeps its original meaning.
   */
  | {
      name: "anchor_missing";
      props: {
        flowId: string;
        stepIndex: number;
        anchor: string;
        pathname: string;
        optional?: true;
      };
    }
  | {
      name: "step_feedback";
      props: { flowId: string; stepIndex: number; clear: boolean; note?: string };
    };

export type CairnEventHandler = (event: CairnEvent) => void;
