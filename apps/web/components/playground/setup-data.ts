/**
 * The two setups, file by file.
 *
 * These mirror `examples/react-vite` and `examples/next-app` in this repo,
 * which CI typechecks, builds and runs a Playwright audit against. Guides that
 * are written by hand drift from the code they describe; these are trimmed
 * from files that have to keep working.
 */
export type SetupFile = {
  path: string;
  /** One line on why the file exists. Shown above the code. */
  why: string;
  code: string;
};

export type Setup = {
  id: "react" | "next";
  label: string;
  blurb: string;
  install: string;
  files: SetupFile[];
};

const ANCHORS: SetupFile = {
  path: "walkthrough/anchors.ts",
  why: "Every target, declared once. This is the file that turns a renamed element into a compile error.",
  code: `import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  nav: { library: "nav.library" },
  library: { tabs: "library.tabs", newCta: "library.new-cta" },
  form: { title: "form.title", submit: "form.submit" },
});`,
};

const FLOWS: SetupFile = {
  path: "walkthrough/flows.ts",
  why: "The tour itself — plain data, no JSX, no dashboard. Diffable in review like anything else.",
  code: `import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

export const libraryFlow = defineFlow({
  id: "create-question",
  version: 1,
  entryRoute: "/",
  steps: [
    {
      anchor: anchors.nav.library,
      title: "Your library",
      body: "Everything you write lives here.",
    },
    {
      anchor: anchors.library.newCta,
      title: "Start one",
      body: "Click Create to open the form.",
      advanceOn: { type: "route", pathname: "/new" },
    },
    {
      anchor: anchors.form.submit,
      title: "Save it",
      body: "Nothing is stored until you save.",
    },
  ],
});

export const flows = [libraryFlow];`,
};

const REGISTER: SetupFile = {
  path: "cairn.d.ts",
  why: "Optional, and the reason the whole thing is safe. Registering narrows every anchor and flow id to your own literals.",
  code: `import type { anchors } from "./walkthrough/anchors";

declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "create-question";
    // Names you pass to useTourAction, if you use them.
    actions: "settings:close";
  }
}`,
};

export const SETUPS: Setup[] = [
  {
    id: "react",
    label: "React",
    blurb: "Vite, react-router. Works the same with TanStack Router, or no router at all.",
    install: "npm i @cairnkit/core @cairnkit/react @cairnkit/ui\nnpm i -D @cairnkit/cli",
    files: [
      ANCHORS,
      FLOWS,
      REGISTER,
      {
        path: "src/router-adapter.ts",
        why: "The only framework-specific file. Ten lines, and it is why this is not a Next.js library.",
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
        path: "src/App.tsx",
        why: "Mount the provider once, high enough that every anchor is inside it. The overlay is a sibling of your app, not a wrapper.",
        code: `import { CairnProvider } from "@cairnkit/react";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import { flows } from "../walkthrough/flows";
import { useReactRouterAdapter } from "./router-adapter";

export function App() {
  return (
    <CairnProvider flows={flows} router={useReactRouterAdapter()}>
      <Routes>{/* your app */}</Routes>

      <CairnOverlay />
      {/* Mount the launcher only on the view the tour starts from. */}
      <TourLauncher flowId="create-question" />
    </CairnProvider>
  );
}`,
      },
      {
        path: "src/main.tsx",
        why: "The stylesheet is a real import — the overlay renders unstyled without it.",
        code: `import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@cairnkit/ui/styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);`,
      },
      {
        path: "src/pages/library.tsx",
        why: "Applying an anchor. Spread it — never add a class for the tour to find.",
        code: `import { anchor } from "@cairnkit/core";
import { anchors } from "../../walkthrough/anchors";

export function Library() {
  return (
    <main>
      <div {...anchor(anchors.library.tabs)}>{/* tabs */}</div>
      <button {...anchor(anchors.library.newCta)}>Create</button>
    </main>
  );
}`,
      },
    ],
  },
  {
    id: "next",
    label: "Next.js",
    blurb: "App Router. A Pages Router adapter ships in the same package.",
    install: "npm i @cairnkit/core @cairnkit/react @cairnkit/ui @cairnkit/next\nnpm i -D @cairnkit/cli",
    files: [
      ANCHORS,
      FLOWS,
      REGISTER,
      {
        path: "app/providers.tsx",
        why: 'A client component, because the provider holds state. This is the only file that needs "use client".',
        code: `"use client";

import type { ReactNode } from "react";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "@/walkthrough/flows";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CairnProvider flows={flows} router={useAppRouterAdapter()}>
      {children}
      <CairnOverlay />
    </CairnProvider>
  );
}`,
      },
      {
        path: "app/layout.tsx",
        why: "A server component. Providers must wrap children — rendered as a sibling it supplies context to nothing.",
        code: `import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@cairnkit/ui/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`,
      },
      {
        path: "app/page.tsx",
        why: "Anchors work in server components too — `anchor()` returns plain props, so nothing here becomes a client component.",
        code: `import Link from "next/link";
import { anchor } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";

export default function Page() {
  return (
    <main>
      <div {...anchor(anchors.library.tabs)}>{/* tabs */}</div>
      <Link href="/new" {...anchor(anchors.library.newCta)}>
        Create
      </Link>
    </main>
  );
}`,
      },
      {
        path: "package.json",
        why: "Wire the check into lint so a broken tour fails the same command everything else fails.",
        code: `{
  "scripts": {
    "lint": "next lint && cairnkit check",
    "build": "next build"
  }
}`,
      },
    ],
  },
];
