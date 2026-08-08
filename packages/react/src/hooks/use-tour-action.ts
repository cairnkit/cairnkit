"use client";

import { useEffect, useRef } from "react";
import type { RegisteredAction, TourAction } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";

/**
 * Publishes an action a step can call, for as long as this component is mounted.
 *
 *   useTourAction("invite:close-settings", () => setSettingsOpen(false));
 *
 * and in the flow file:
 *
 *   onExit: (_dir, ctx) => ctx.run("invite:close-settings")
 *
 * This exists because steps are data. A step anchored inside a modal has to
 * close that modal before the next step measures a target behind it, and the
 * setter that closes it lives in a component the flow file cannot see.
 *
 * The action is withdrawn on unmount, so a step that calls it after the
 * component is gone warns and moves on rather than throwing.
 */
export function useTourAction(name: RegisteredAction, fn: TourAction) {
  const { actions } = useCairn();

  // Registering a stable wrapper that reads the latest closure means an inline
  // arrow does not churn the registry on every render. Both writes happen in
  // effects: assigning to a ref during render is unsafe under React Compiler.
  const latest = useRef(fn);

  useEffect(() => {
    latest.current = fn;
  });

  // `register` returns its own withdraw function, which is exactly the
  // cleanup React wants here.
  useEffect(() => actions.register(name, () => latest.current()), [actions, name]);
}
