import type { TourDismissReason } from "../flows/types";

export type TourState = {
  activeFlowId: string | null;
  stepIndex: number;
  /** flowId -> version the user finished. */
  completedFlows: Record<string, number>;
  /** flowId -> version the user skipped out of. */
  dismissedFlows: Record<string, number>;
};

export type TourStore = {
  getState(): TourState;
  subscribe(listener: () => void): () => void;
  start(flowId: string, stepIndex?: number): void;
  goToStep(stepIndex: number): void;
  complete(flowId: string, version: number): void;
  /** `reason` is optional so an existing custom store keeps type-checking. */
  dismiss(
    flowId: string,
    version: number,
    stepIndex: number,
    reason?: TourDismissReason,
  ): void;
  stop(): void;
  reset(): void;
};

export type PersistAdapter = {
  read(): Partial<TourState> | null;
  write(state: TourState): void;
};
