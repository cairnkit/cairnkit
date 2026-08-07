"use client";

import { cx } from "../lib/cx";

export function ProgressRail({ current, total }: { current: number; total: number }) {
  return (
    <div className="cairn-rail" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cx("cairn-rail__seg", index < current && "cairn-rail__seg--done")} />
      ))}
    </div>
  );
}
