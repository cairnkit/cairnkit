"use client";

import { useTour } from "@cairnkit/react";

export function StartTour({ className = "btn btn--ghost" }: { className?: string }) {
  const { start } = useTour();
  return (
    <button className={className} onClick={() => start("tour-of-this-page")}>
      Take the tour of this page
    </button>
  );
}
