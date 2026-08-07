"use client";

import type { ReactNode } from "react";
import { CairnIcon } from "../atoms/icons";
import { cx } from "../lib/cx";

export type LauncherPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "top-left"
  | "top-center"
  | "inline";

export type LauncherProps = {
  label: string;
  onClick: () => void;
  /** Where it parks. `inline` drops it into normal flow. Default bottom-right. */
  position?: LauncherPosition;
  /** Staggered waves so one is always mid-flight. */
  pulse?: boolean;
  /**
   * Replace the stones with your own mark.
   *
   * Rendered into a fixed slot — 20px floating, 17px inline — and clamped by
   * CSS regardless of the artwork's own size. Supply an SVG using
   * `currentColor` so it inherits light and dark automatically; a 24x24
   * viewBox scales cleanly. Override the slot with `--cairn-launcher-icon`.
   */
  icon?: ReactNode;
  className?: string;
};

export function Launcher({
  label,
  onClick,
  position = "bottom-right",
  pulse = true,
  icon,
  className,
}: LauncherProps) {
  return (
    <div className={cx("cairn-launcher", `cairn-launcher--${position}`, className)}>
      <button type="button" className="cairn-launcher__btn" aria-label={label} onClick={onClick}>
        {pulse &&
          [0, 870, 1740].map((delay) => (
            <span key={delay} className="cairn-launcher__wave" style={{ animationDelay: `${delay}ms` }} aria-hidden />
          ))}
        {icon ?? <CairnIcon />}
      </button>
    </div>
  );
}
