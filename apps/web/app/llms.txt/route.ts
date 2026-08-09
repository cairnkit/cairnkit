import { DOC_NAV, href } from "../docs/nav";
import { site } from "../site";

/**
 * A machine-readable summary of the whole library, at /llms.txt.
 *
 * Coding agents are increasingly the thing that reads these docs and writes
 * the integration, and they arrive one page at a time. An agent that lands on
 * /docs/install alone cannot finish: the page shows a provider importing
 * `./anchors` and `./flows` without saying what either contains. It then
 * guesses, and the guess compiles just often enough to be worse than failing.
 *
 * This is the single fetch that answers the whole question — enough to write a
 * correct integration without needing to crawl fourteen pages, plus the
 * mistakes we have actually watched agents make.
 *
 * Served as a route rather than a static file so the page index cannot drift
 * from `DOC_NAV`, which is the same source the sidebar and sitemap use.
 */
export const dynamic = "force-static";

export function GET() {
  const pages = DOC_NAV.flatMap((section) =>
    section.pages.map((page) => `- [${page.title}](${site.url}${href(page.slug)}): ${page.blurb}`),
  ).join("\n");

  const body = `# ${site.name}

> ${site.description}

Product tours defined as typed data in your repository. Anchors are referenced
by name, never by CSS selector, so a renamed or deleted element fails the build
instead of silently pointing a tour at nothing.

- Packages: @cairnkit/core, @cairnkit/react, @cairnkit/ui, @cairnkit/next, @cairnkit/cli
- License: MIT. Runtime dependencies: zero (the overlay adds @floating-ui/dom)
- Supports: React 18 and 19; Next.js App Router and Pages Router; Vite; react-router v6 and v7
- Server-rendered safe. No client JavaScript is required to render a page containing a provider.
- Repository: ${site.repo}

## Fastest correct integration

\`\`\`bash
npx @cairnkit/cli init
\`\`\`

Detects the framework, whether source lives under src/, the tsconfig path alias
and the package manager, then writes the four files below. It never overwrites
an existing file and never edits your layout — it prints that step instead.
Flags: --dir <path>, --dry-run.

## The four files

1. Anchor registry — every element a tour can point at, declared once.

\`\`\`ts
import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  nav: { home: "nav.home" },
  home: { primaryAction: "home.primary-action" },
});
\`\`\`

2. Flow — plain data, no JSX.

\`\`\`ts
import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

export const gettingStarted = defineFlow({
  id: "getting-started",
  version: 1,
  entryRoute: "/",
  steps: [
    { anchor: anchors.nav.home, title: "Start here", body: "First thing to notice." },
    { anchor: anchors.home.primaryAction, title: "Do this", body: "The main action." },
  ],
});

export const flows = [gettingStarted];
\`\`\`

3. Type registry — optional, and the reason the rest is safe. Must augment
   "@cairnkit/core" by name, and @cairnkit/core must be a direct dependency or
   it will not compile under pnpm.

\`\`\`ts
import type { anchors } from "./anchors";

declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "getting-started";
  }
}
\`\`\`

4. Provider — a client component in Next. It must WRAP your app.

\`\`\`tsx
"use client";

import type { ReactNode } from "react";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "./flows";

export function CairnRuntime({ children }: { children: ReactNode }) {
  return (
    <CairnProvider flows={flows} router={useAppRouterAdapter()}>
      {children}
      <CairnOverlay />
    </CairnProvider>
  );
}
\`\`\`

Then mount it in app/layout.tsx, wrapping children:

\`\`\`tsx
import { CairnRuntime } from "@/walkthrough/cairn-provider";
import "@cairnkit/ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CairnRuntime>{children}</CairnRuntime>
      </body>
    </html>
  );
}
\`\`\`

And apply an anchor to a real element:

\`\`\`tsx
import { anchor } from "@cairnkit/core";

<button {...anchor(anchors.home.primaryAction)}>Upgrade</button>
\`\`\`

## Verify the integration

\`\`\`bash
npx tsc --noEmit      # a mistyped anchor or flow id fails here
npx cairn check       # an anchor never applied to an element fails here
\`\`\`

\`cairn check\` defaults to "src" and accepts several roots, scanned as one
project: \`npx cairn check src app\`. It exits non-zero with the file and line
of the flow that breaks, which makes it a self-correction step rather than only
a CI gate.

## Mistakes observed in real integrations

- Rendering the provider as a SIBLING of the app instead of wrapping it. Context
  reaches nothing and every useTour() throws.
- Omitting "use client" on the provider in the Next App Router.
- Omitting @cairnkit/core from dependencies. npm hoists it and hides this; pnpm
  does not, and the type registry silently fails to compile.
- Omitting the @cairnkit/ui stylesheet import. The store runs and nothing renders.
- Mounting TourLauncher in the app shell. It then follows users onto pages its
  guide says nothing about. Mount it on the view the tour describes.
- Anchoring a step to a whole dialog rather than a control inside it. The card
  has nowhere to sit and is pushed outside the dialog.
- Forgetting that a step inside a modal must close it before the next step, which
  is what onExit is for:
  \`onExit: (direction, ctx) => ctx.run("settings:close")\`, paired with
  \`useTourAction("settings:close", () => setOpen(false))\` in the component that
  owns the state. Steps are module-level data and cannot close over that setter.
- Driving the UI for the user. Closing a dialog they opened is cleanup; clicking
  the button a step is teaching means they learn nothing.

## Documentation

${pages}

## Interactive

- [Playground](${site.url}/playground): a real tour against a real UI, with the
  generated flow shown as you change it, plus end-to-end React and Next setups.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
