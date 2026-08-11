"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { ActionRegistry, CairnEventHandler, FlowRegistry, TourStore } from "@cairnkit/core";
import type { RouterAdapter } from "../adapters/router";

export type CairnNotice =
  | { reason: "anchor-missing"; flowId: string; stepIndex: number }
  | { reason: "paused"; flowId: string }
  | { reason: "handoff"; fromFlowId: string; toFlowId: string };

export type CairnContextValue = {
  store: TourStore;
  flows: FlowRegistry;
  /** Actions published by mounted components, callable from step hooks. */
  actions: ActionRegistry;
  /**
   * The part of the screen in front — the tab showing, the wizard stage open.
   * `null` when the app has not declared one, which constrains nothing.
   * Declare it with `useTourScope`; do not set it from here.
   */
  scope: string | null;
  setScope: Dispatch<SetStateAction<string | null>>;
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
