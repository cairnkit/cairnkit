"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createActionRegistry,
  createFlowRegistry,
  createTourStore,
  localStoragePersist,
  type CairnEvent,
  type CairnEventHandler,
  type TourFlow,
  type TourStore,
} from "@cairnkit/core";
import { memoryRouter, type RouterAdapter } from "../adapters/router";
import { CairnContext, type CairnNotice } from "./cairn-context";

export type CairnProviderProps = {
  flows: TourFlow[];
  router?: RouterAdapter;
  onEvent?: CairnEventHandler;
  translate?: (key: string) => string;
  /** Surface "the guide paused" / "we lost the step" to the user however you like. */
  onNotice?: (notice: CairnNotice) => void;
  /** Below this width a step's `mobileAnchor` is preferred. Default 768. */
  mobileBreakpoint?: number;
  /** Supply your own to sync progress somewhere other than localStorage. */
  store?: TourStore;
  children?: ReactNode;
};

/**
 * Mounts the tour runtime. Renders only its children — the overlay lives in
 * `@cairnkit/ui`, or in your own components driven by `useTour()`.
 */
export function CairnProvider({
  flows,
  router = memoryRouter,
  onEvent,
  translate,
  onNotice,
  mobileBreakpoint = 768,
  store,
  children,
}: CairnProviderProps) {
  // Held outside the memo below on purpose: that one recomputes whenever
  // `flows` changes identity, and rebuilding the registry there would drop
  // every action currently published by a mounted component.
  const [actions] = useState(createActionRegistry);

  // Which tab, stage or pane is in front. Kept here rather than in the store
  // because it describes the app, not the tour, and must not be persisted.
  const [scope, setScope] = useState<string | null>(null);

  /**
   * The default store is built once and never rebuilt.
   *
   * It used to be created inside the memo below, so anything that changed a
   * memo dependency — an inline `flows` array, a scope change — produced a new
   * store and a new subscription mid-tour. `onEvent` is read through a ref so
   * a store this long-lived still calls the handler the consumer has now.
   */
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  const [defaultStore] = useState(() =>
    createTourStore({
      persist: localStoragePersist(),
      onEvent: (event: CairnEvent) => onEventRef.current?.(event),
    }),
  );

  const value = useMemo(
    () => ({
      store: store ?? defaultStore,
      flows: createFlowRegistry(flows),
      actions,
      scope,
      setScope,
      router,
      onEvent,
      translate,
      onNotice,
      mobileBreakpoint,
    }),
    [
      flows,
      router,
      onEvent,
      translate,
      onNotice,
      mobileBreakpoint,
      store,
      defaultStore,
      actions,
      scope,
    ],
  );

  return <CairnContext.Provider value={value}>{children}</CairnContext.Provider>;
}
