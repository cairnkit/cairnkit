/**
 * Line icons drawn on a 24 grid, 1.6 stroke, currentColor.
 *
 * Deliberately technical rather than decorative — no sparkles, no gradients,
 * no emoji. They should read as diagram, not ornament.
 */
const s = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconRegistry = () => (
  <svg {...s}><path d="M4 7h6M4 12h10M4 17h5" /><rect x="15" y="4" width="5" height="5" rx="1.2" /><rect x="15" y="15" width="5" height="5" rx="1.2" /></svg>
);
export const IconTarget = () => (
  <svg {...s}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>
);
export const IconFlow = () => (
  <svg {...s}><rect x="3" y="4" width="7" height="5" rx="1.3" /><rect x="14" y="15" width="7" height="5" rx="1.3" /><path d="M6.5 9v4.5a2 2 0 0 0 2 2H14" /></svg>
);
export const IconShield = () => (
  <svg {...s}><path d="M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6l-7-3Z" /><path d="m9.2 12 2 2 3.6-3.8" /></svg>
);
export const IconForward = () => (
  <svg {...s}><path d="M4 12h13" /><path d="m12 7 5 5-5 5" /><path d="M20 5v14" /></svg>
);
export const IconSwitch = () => (
  <svg {...s}><path d="M4 8h11l-3-3M20 16H9l3 3" /></svg>
);
export const IconPause = () => (
  <svg {...s}><circle cx="12" cy="12" r="8.5" /><path d="M10 9.5v5M14 9.5v5" /></svg>
);
export const IconLayers = () => (
  <svg {...s}><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 12.5 8 4.5 8-4.5" /><path d="m4 16.8 8 4.5 8-4.5" /></svg>
);
export const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14m-5-5 5 5-5 5" />
  </svg>
);
