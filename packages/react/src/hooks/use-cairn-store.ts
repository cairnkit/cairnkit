"use client";

import { useSyncExternalStore } from "react";
import type { TourState } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";

/**
 * Subscribes to a slice of tour state.
 *
 * `useSyncExternalStore` rather than a state library — it is the React API
 * built for exactly this, and it keeps `core` dependency-free.
 */
export function useTourState<T>(selector: (state: TourState) => T): T {
  const { store } = useCairn();

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
