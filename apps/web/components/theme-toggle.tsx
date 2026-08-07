"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const ORDER: Theme[] = ["system", "light", "dark"];

const ICONS: Record<Theme, string> = {
  system: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18",
  light: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  dark: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z",
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme((localStorage.getItem("theme") as Theme) ?? "system");
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    localStorage.setItem("theme", next);
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    // Keep the tour overlay in step with the page.
    if (next === "system") root.removeAttribute("data-cairn-theme");
    else root.setAttribute("data-cairn-theme", next);
  };

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!;

  return (
    <button
      className="themebtn"
      onClick={() => apply(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[theme]} />
      </svg>
    </button>
  );
}

/**
 * Runs before paint so a dark-mode visitor never sees a white flash.
 * Inline and synchronous on purpose — a deferred script is too late.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t&&t!=="system"){document.documentElement.setAttribute("data-theme",t);document.documentElement.setAttribute("data-cairn-theme",t)}}catch(e){}})()`;
