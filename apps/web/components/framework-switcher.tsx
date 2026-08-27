"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { highlight } from "@/components/ui/highlight";
import { IconArrow } from "@/components/icons";

/**
 * "Does this work with my stack" answered in code, not in adjectives.
 *
 * This replaced a row of pills reading "React 18 & 19 / Next.js 14, 15, 16 /
 * App & Pages Router". Every word of that was true and none of it was useful:
 * a reader deciding whether to install something wants to see the file they
 * will have to write, in their own framework, before they commit.
 *
 * The pills survive underneath, because the version matrix is still the fastest
 * way to answer the narrower question.
 *
 * Every snippet below is the mount for a router adapter that actually ships.
 * `appRouterAdapter` and `usePagesRouterAdapter` come from `@cairnkit/next`;
 * `memoryRouter` from `@cairnkit/react`; the react-router one is ten lines the
 * reader writes, which is the point being made about the seam.
 */
type Target = {
  id: string;
  label: string;
  blurb: string;
  file: string;
  doc: string;
  code: string;
};

const TARGETS: Target[] = [
  {
    id: "next-app",
    label: "Next.js App Router",
    blurb:
      "One client component holds the provider. Anchors still work in server components, because anchor() returns plain props.",
    file: "app/providers.tsx",
    doc: "/docs/nextjs",
    code: `"use client";

import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "@/walkthrough/flows";

export function Providers({ children }) {
  return (
    <CairnProvider flows={flows} router={useAppRouterAdapter()}>
      {children}
      <CairnOverlay />
    </CairnProvider>
  );
}`,
  },
  {
    id: "next-pages",
    label: "Next.js Pages Router",
    blurb:
      "The same adapter package. Pages Router reports the route pattern rather than the path, so the adapter reads asPath for you.",
    file: "pages/_app.tsx",
    doc: "/docs/nextjs",
    code: `import { CairnProvider } from "@cairnkit/react";
import { usePagesRouterAdapter } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "@/walkthrough/flows";
import "@cairnkit/ui/styles.css";

export default function App({ Component, pageProps }) {
  return (
    <CairnProvider flows={flows} router={usePagesRouterAdapter()}>
      <Component {...pageProps} />
      <CairnOverlay />
    </CairnProvider>
  );
}`,
  },
  {
    id: "react",
    label: "React + Vite",
    blurb:
      "The only framework-specific file you write, and it is ten lines. The same shape works for TanStack Router.",
    file: "src/router-adapter.ts",
    doc: "/docs/react",
    code: `import { useLocation, useNavigate } from "react-router-dom";
import type { RouterAdapter } from "@cairnkit/react";

export function useReactRouterAdapter(): RouterAdapter {
  const navigate = useNavigate();

  return {
    usePathname: () => useLocation().pathname,
    navigate: (href) => navigate(href),
  };
}`,
  },
  {
    id: "none",
    label: "No router",
    blurb:
      "A single-page app with no routing at all still gets tours. memoryRouter reads window.location and is the default in tests.",
    file: "src/main.tsx",
    doc: "/docs/react",
    code: `import { CairnProvider, memoryRouter } from "@cairnkit/react";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import { flows } from "./walkthrough/flows";
import "@cairnkit/ui/styles.css";

export function App() {
  return (
    <CairnProvider flows={flows} router={memoryRouter}>
      <Dashboard />

      <CairnOverlay />
      <TourLauncher flowId="create-question" />
    </CairnProvider>
  );
}`,
  },
];

const VERSIONS = [
  "React 18 & 19",
  "Next.js 14, 15, 16",
  "Server-rendered",
  "Vite & any bundler",
] as const;

export function FrameworkSwitcher() {
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const target = TARGETS[index]!;

  /** A tablist is expected to move on arrow keys; a row of buttons does not. */
  function onKeyDown(event: React.KeyboardEvent) {
    const last = TARGETS.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    setIndex(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="fw">
      <div className="fw__copy">
        <p className="eyebrow">Your stack</p>
        <h2 className="h fw__h">
          Use cairnkit with <span className="fw__target">{target.label}</span>
        </h2>
        <p className="lede fw__blurb">{target.blurb}</p>

        <ul className="fw__pills">
          {VERSIONS.map((version) => (
            <li key={version}>{version}</li>
          ))}
        </ul>
      </div>

      <div className="fw__panel">
        <div className="fw__tabs" role="tablist" aria-label="Framework" onKeyDown={onKeyDown}>
          {TARGETS.map((entry, position) => {
            const on = position === index;

            return (
              <button
                key={entry.id}
                ref={(node) => {
                  tabs.current[position] = node;
                }}
                type="button"
                role="tab"
                id={`fw-tab-${entry.id}`}
                aria-selected={on}
                aria-controls={`fw-panel-${entry.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setIndex(position)}
                className={`fw__tab${on ? " fw__tab--on" : ""}`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`fw-panel-${target.id}`}
          aria-labelledby={`fw-tab-${target.id}`}
          tabIndex={0}
          className="editor fw__editor"
        >
          <div className="editor__bar">
            <span className="editor__dot" />
            <span className="editor__dot" />
            <span className="editor__dot" />
            <span className="editor__file">{target.file}</span>
          </div>
          <pre>{highlight(target.code)}</pre>
        </div>

        <Link className="fw__docs" href={target.doc}>
          Read the setup for {target.label} <IconArrow />
        </Link>
      </div>
    </div>
  );
}
