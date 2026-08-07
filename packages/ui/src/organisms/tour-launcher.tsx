"use client";

import { useTour, useTourState } from "@cairnkit/react";
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
 */
export function TourLauncher({
  flowId,
  label = "Watch guide",
  position,
  pulse,
  icon,
  className,
}: TourLauncherProps) {
  const { start } = useTour();
  const activeFlowId = useTourState((state) => state.activeFlowId);

  // A tour is running — the launcher would float over its own spotlight.
  if (activeFlowId) return null;

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
