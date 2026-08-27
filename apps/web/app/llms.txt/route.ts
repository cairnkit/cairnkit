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

- Packages: @cairnkit/core, @cairnkit/react, @cairnkit/ui, @cairnkit/next, @cairnkit/cli, @cairnkit/cloud
- License: MIT. Runtime dependencies: zero (the overlay adds @floating-ui/dom)
- Supports: React 18 and 19; Next.js App Router and Pages Router; Vite; react-router v6 and v7
- Server-rendered safe. No client JavaScript is required to render a page containing a provider.
- Repository: ${site.repo}

## Fastest correct integration

\`\`\`bash
npx cairnkit init
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

The \`router\` prop is the one framework-specific decision, and it is the thing
most worth getting right. Pick the adapter for your setup:

- Next.js App Router: \`useAppRouterAdapter()\` from @cairnkit/next
- Next.js Pages Router: \`usePagesRouterAdapter()\` from @cairnkit/next
- react-router, TanStack Router, anything else: ten lines you write, below
- No router at all: \`memoryRouter\` from @cairnkit/react

\`\`\`tsx
// Pages Router, in pages/_app.tsx
import { usePagesRouterAdapter } from "@cairnkit/next";

<CairnProvider flows={flows} router={usePagesRouterAdapter()}>
\`\`\`

\`\`\`ts
// Any other router. RouterAdapter is two functions, nothing more.
import type { RouterAdapter } from "@cairnkit/react";

export function useReactRouterAdapter(): RouterAdapter {
  const navigate = useNavigate();
  return {
    usePathname: () => useLocation().pathname,
    navigate: (href) => navigate(href),
  };
}
\`\`\`

\`\`\`tsx
// No router in the app at all. Do NOT hand-write one that returns a fixed "/":
// it reports the wrong route everywhere, so pauseRoutes never pauses and
// resumeAt never catches up.
import { memoryRouter } from "@cairnkit/react";

<CairnProvider flows={flows} router={memoryRouter}>
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
npx cairnkit check       # an anchor never applied to an element fails here
\`\`\`

Given no argument, \`cairnkit check\` scans whichever of \`src\`, \`app\`, \`pages\`,
\`walkthrough\`, \`lib\` and \`components\` exist, falling back to the working
directory when none do — so it works in a project created with --no-src-dir
without being told. Explicit roots are scanned as one project:
\`npx cairnkit check src app\`, which is what lets a flow in one directory point
at a component in another.

It exits non-zero with the file and line of the flow that breaks, which makes it
a self-correction step rather than only a CI gate.

## Reading the project as data

\`cairnkit status\` describes what is there rather than judging it: every anchor,
whether an element carries it, whether it got there through the typed spread or
a bare data-cairn attribute, where it was declared, and which flows point at it.
It always exits 0.

\`--json\` works on both commands. stdout carries exactly one JSON object and
every human-facing message goes to stderr, so it can be piped straight into a
parser.

\`\`\`bash
npx cairnkit status --json    # the anchor graph
npx cairnkit check --json     # findings, each with file and line
\`\`\`

This is the shape to read before writing a tour into an unfamiliar project. The
anchor graph is not derivable by grepping: it needs the registry path resolution
and the rule that flow files reference anchors rather than apply them. Write the
files with your own tools, then run \`cairnkit check --json\` to confirm the
result, which turns a guess into something verified.

The payload carries a \`version\` field so a consumer can tell one shape from
another.

## Optional: reporting to cairnkit cloud

@cairnkit/cloud (2.8 kb gzipped) turns the onEvent callback into completion
rates and alerts. Entirely optional — the library is MIT and complete without
it, and onEvent points just as happily at PostHog, Segment or your own endpoint.

\`\`\`tsx
import { sendToCloud } from "@cairnkit/cloud";

<CairnProvider flows={flows} onEvent={sendToCloud({ key: process.env.NEXT_PUBLIC_CAIRNKIT_KEY! })}>
\`\`\`

The key is publishable and belongs in the browser bundle: it can write events to
one project and read nothing at all. Calling sendToCloud repeatedly with the same
key returns the same transport, so calling it inline during render is correct and
does not accumulate queues or listeners.

Wire contract, for anyone self-hosting the receiving end:

\`\`\`
POST <endpoint>            content-type: text/plain (skips the CORS preflight)
{ key, sessionId, userId?, events: [{ id, name, at, viewport: {w,h}, runId?, props }] }

202 { accepted, duplicates }   stored; duplicates were already held
400 { error: "invalid_payload", issues }
401 { error: "invalid_key" }    revoked or unknown — NOT retried by the client
413 { error: "payload_too_large" }
429 { error: "rate_limited", scope: "minute" | "month" }  + Retry-After seconds
\`\`\`

429 IS retried, with the server's Retry-After honoured up to 60s. Every other 4xx
is treated as permanent and reported once through onError. Event ids are chosen
before the first send attempt, so redelivering a batch is safe and is counted as
duplicates rather than stored twice.

Limits per project: 50 events per request, 64 KB per body, 600 requests per
minute, and a monthly event ceiling. The monthly figure counts stored events, so
deduplicated retries do not consume it.

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
- Giving two guides on one TABBED page nothing to tell them apart. Switching tabs
  changes no pathname, so route handling cannot see it, and anchors are often
  shared between tabs — a tab strip belongs to neither panel — so the running
  guide keeps describing the panel you are no longer looking at. Give each flow a
  \`scope\` and call \`useTourScope(activeTab)\` in the component that owns the tab
  state. A query param such as \`?tab=sharing\` does NOT help: every adapter
  reports the pathname alone, deliberately, so filters and sorting cannot disturb
  a tour.
- Calling useTour() more than once on a page. It is the driver — it binds advance
  listeners, fires onEnter, and ends flows whose anchor never arrived — so a
  second copy does all of that twice. To read the tour without driving it use
  \`useActiveTour()\`; to start one, \`useStartTour()\`.
- Switching tabs from a step's onEnter so the guide can open its own tab. It
  deadlocks: a flow in the wrong scope is dormant, and a dormant step never runs
  onEnter, so the hook that would fix the scope never fires. Have the app watch
  \`useActiveTour().flow\` and bring \`flow.scope\` forward once when the flow
  changes — keyed on the change, or it drags the user back every time they
  switch tabs mid-tour.

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
