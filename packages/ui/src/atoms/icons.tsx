"use client";

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const CloseIcon = () => (
  <svg {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>
);

export const ArrowLeftIcon = () => (
  <svg {...base} width={14} height={14}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);

export const ArrowRightIcon = () => (
  <svg {...base} width={14} height={14}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);

/** Stacked stones — the compact cairn, drawn to stay legible at 20px. */
export const CairnIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <ellipse cx="12" cy="18.7" rx="9.2" ry="2.7" />
    <ellipse cx="13" cy="12.2" rx="6.6" ry="2.5" />
    <ellipse cx="10.9" cy="6" rx="4.4" ry="2.25" />
  </svg>
);
