"use client";

import { useActiveTour, useStartTour } from "@cairnkit/react";
import type { ReactNode } from "react";
import type { RegisteredFlowId } from "@cairnkit/core";
import { Launcher, type LauncherPosition } from "./launcher";

export type TourLauncherProps = {
  flowId: RegisteredFlowId;
  label?: string;
  /** Where it parks. Default bottom-right; use `inline` to place it yourself. */
  position?: LauncherPosition;
  pulse?: boolean;
  icon?: ReactNode;
  className?: string;
};

/**
 * Mount this on the view its guide describes, not in the app shell — that way
 * it only appears where the guide has something to say.
 *
 * It reads the tour rather than driving it. Using `useTour` here put a second
 * driver on the page next to the overlay's, which fired every `onEnter` twice.
 */
export function TourLauncher({
  flowId,
  label = "Watch guide",
  position,
  pulse,
  icon,
  className,
}: TourLauncherProps) {
  const start = useStartTour();
  const { flow, isPaused } = useActiveTour();

  // A tour is on screen — the launcher would float over its own spotlight.
  // A dormant one is different: the user has stepped somewhere that guide does
  // not cover, and this is how they reach the guide that covers it. Offering
  // to restart the dormant flow itself would throw away its progress, so that
  // one stays hidden.
  const isShowingTour = flow !== null && !isPaused;
  if (isShowingTour || flow?.id === flowId) return null;

  return (
    <Launcher
      label={label}
      position={position}
      pulse={pulse}
      icon={icon}
      className={className}
      onClick={() => start(flowId)}
    />
  );
}
