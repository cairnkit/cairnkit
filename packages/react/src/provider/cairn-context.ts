"use client";

import { createContext, useContext } from "react";
import type { CairnEventHandler, FlowRegistry, TourStore } from "@cairnkit/core";
import type { RouterAdapter } from "../adapters/router";

export type CairnNotice =
  | { reason: "anchor-missing"; flowId: string; stepIndex: number }
  | { reason: "paused"; flowId: string }
  | { reason: "handoff"; fromFlowId: string; toFlowId: string };

export type CairnContextValue = {
  store: TourStore;
  flows: FlowRegistry;
  router: RouterAdapter;
  onEvent?: CairnEventHandler;
  /** Resolves `titleKey` / `bodyKey` when copy lives in an i18n catalogue. */
  translate?: (key: string) => string;
  /** Below this width a step's `mobileAnchor` is preferred. Default 768. */
  mobileBreakpoint: number;
  /** Called when a tour ends or pauses for a reason worth telling the user. */
  onNotice?: (notice: CairnNotice) => void;
};

export const CairnContext = createContext<CairnContextValue | null>(null);

export function useCairn(): CairnContextValue {
  const value = useContext(CairnContext);
  if (!value) throw new Error("[cairn] useCairn must be used inside <CairnProvider>.");
  return value;
}
