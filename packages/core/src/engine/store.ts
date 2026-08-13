import type { CairnEventHandler } from "../events/types";
import type { PersistAdapter, TourState, TourStore } from "./types";

const EMPTY: TourState = {
  activeFlowId: null,
  stepIndex: 0,
  completedFlows: {},
  dismissedFlows: {},
};

/**
 * Minimal observable store, shaped for `useSyncExternalStore`.
 *
 * Hand-rolled rather than pulling in a state library: `core` having zero
 * runtime dependencies is what makes it cheap for anyone to adopt, and this is
 * about forty lines.
 */
export function createTourStore(options: {
  persist?: PersistAdapter;
  onEvent?: CairnEventHandler;
} = {}): TourStore {
  const { persist, onEvent } = options;

  let state: TourState = { ...EMPTY, ...(persist?.read() ?? {}) };
  const listeners = new Set<() => void>();

  const set = (next: Partial<TourState>) => {
    state = { ...state, ...next };
    persist?.write(state);
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    start(flowId, stepIndex = 0) {
      set({ activeFlowId: flowId, stepIndex });
    },

    goToStep(stepIndex) {
      set({ stepIndex: Math.max(0, stepIndex) });
    },

    complete(flowId, version) {
      onEvent?.({ name: "flow_completed", props: { flowId, version } });
      set({
        activeFlowId: null,
        stepIndex: 0,
        completedFlows: { ...state.completedFlows, [flowId]: version },
      });
    },

    dismiss(flowId, version, stepIndex, reason) {
      // Passed through rather than defaulted. An overlay that does not say
      // which control was used should leave the field absent, so the data can
      // tell "we do not know" apart from "they pressed Skip" — defaulting to
      // `skipped` here would silently invent the most common answer.
      onEvent?.({ name: "flow_dismissed", props: { flowId, version, stepIndex, reason } });
      set({
        activeFlowId: null,
        stepIndex: 0,
        dismissedFlows: { ...state.dismissedFlows, [flowId]: version },
      });
    },

    stop() {
      set({ activeFlowId: null, stepIndex: 0 });
    },

    reset() {
      set({ ...EMPTY });
    },
  };
}

/** localStorage persistence. Tours cross routes, so progress must survive a page transition. */
export function localStoragePersist(key = "cairn"): PersistAdapter {
  return {
    read() {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as Partial<TourState>) : null;
      } catch {
        return null;
      }
    },
    write(state) {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* quota or private mode — progress is not worth throwing over */
      }
    },
  };
}
