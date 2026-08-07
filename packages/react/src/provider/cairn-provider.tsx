"use client";

import { useMemo, type ReactNode } from "react";
import {
  createFlowRegistry,
  createTourStore,
  localStoragePersist,
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
  const value = useMemo(
    () => ({
      store: store ?? createTourStore({ persist: localStoragePersist(), onEvent }),
      flows: createFlowRegistry(flows),
      router,
      onEvent,
      translate,
      onNotice,
      mobileBreakpoint,
    }),
    [flows, router, onEvent, translate, onNotice, mobileBreakpoint, store],
  );

  return <CairnContext.Provider value={value}>{children}</CairnContext.Provider>;
}
