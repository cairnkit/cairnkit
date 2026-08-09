#!/usr/bin/env bash
# Compiles the integration the *documentation* tells you to write.
#
# scripts/init-matrix.sh proves the CLI's output works. This proves the docs do,
# which is a different claim: someone following the site by hand — or an agent
# landing on one page from search — never runs init at all. The code below is
# transcribed from the published examples, deliberately not generated, so it
# fails when the docs drift from reality.
set -uo pipefail

ROOT="${TMPDIR:-/tmp}/cairn-docs-matrix"
rm -rf "$ROOT"; mkdir -p "$ROOT"

PASS=0; FAIL=0
result() {
  if [ "$2" -eq 0 ]; then printf "  \033[32mPASS\033[0m  %-26s %s\n" "$1" "$3"; PASS=$((PASS+1));
  else printf "  \033[31mFAIL\033[0m  %-26s %s\n" "$1" "$3"; FAIL=$((FAIL+1)); fi
}

TSCONFIG='{"compilerOptions":{"target":"ES2022","lib":["dom","esnext"],"jsx":"preserve","module":"esnext","moduleResolution":"bundler","strict":true,"noEmit":true,"skipLibCheck":true,"paths":{"@/*":["./*"]}},"include":["**/*.ts","**/*.tsx"]}'

# Anchors and flows are framework-independent, straight from /docs/anchors and
# /docs/flows.
shared() {
  mkdir -p walkthrough
  cat > walkthrough/anchors.ts <<'EOF'
import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  nav: { home: "nav.home" },
  home: { primaryAction: "home.primary-action" },
});
EOF
  cat > walkthrough/flows.ts <<'EOF'
import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

export const onboarding = defineFlow({
  id: "onboarding",
  version: 1,
  entryRoute: "/",
  steps: [
    { anchor: anchors.nav.home, title: "Start here", body: "First thing." },
    { anchor: anchors.home.primaryAction, title: "Do this", body: "Main action." },
  ],
});

export const flows = [onboarding];
EOF
  cat > walkthrough/cairn.d.ts <<'EOF'
import type { anchors } from "./anchors";

declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "onboarding";
  }
}
EOF
}

compile() { # name, extra npm packages
  local name="$1"; shift
  npm install @cairnkit/core @cairnkit/react @cairnkit/ui "$@" \
    typescript@5 @types/react@19 @types/react-dom@19 @types/node --silent >/dev/null 2>&1
  local out; out=$(./node_modules/.bin/tsc --noEmit 2>&1 | head -3)
  [ -z "$out" ]; result "$name" $? "${out:-compiles}"
}

echo ""
echo "── Following the docs by hand, then compiling ───────────────────"

# ── Next.js App Router — /docs/nextjs ────────────────────────────────
mkdir -p "$ROOT/next-app/app"; cd "$ROOT/next-app"
echo '{"name":"a","private":true,"dependencies":{"next":"15.5.23","react":"19.0.0","react-dom":"19.0.0"}}' > package.json
echo "$TSCONFIG" > tsconfig.json
shared
cat > app/providers.tsx <<'EOF'
"use client";

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
}
EOF
cat > app/layout.tsx <<'EOF'
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF
compile "next app router" next@15.5.23 @cairnkit/next

# ── Next.js Pages Router — /docs/nextjs ──────────────────────────────
mkdir -p "$ROOT/next-pages/pages"; cd "$ROOT/next-pages"
echo '{"name":"b","private":true,"dependencies":{"next":"15.5.23","react":"19.0.0","react-dom":"19.0.0"}}' > package.json
echo "$TSCONFIG" > tsconfig.json
shared
cat > pages/_app.tsx <<'EOF'
import type { AppProps } from "next/app";
import { CairnProvider } from "@cairnkit/react";
import { usePagesRouterAdapter } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "../walkthrough/flows";
import "@cairnkit/ui/styles.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CairnProvider flows={flows} router={usePagesRouterAdapter()}>
      <Component {...pageProps} />
      <CairnOverlay />
    </CairnProvider>
  );
}
EOF
compile "next pages router" next@15.5.23 @cairnkit/next

# ── React + react-router v7 — /docs/react ────────────────────────────
mkdir -p "$ROOT/rr7/src"; cd "$ROOT/rr7"
echo '{"name":"c","private":true,"dependencies":{"react":"19.0.0","react-dom":"19.0.0","react-router":"7.1.0"}}' > package.json
echo "$TSCONFIG" > tsconfig.json
shared
cat > src/router-adapter.ts <<'EOF'
// v7: import from "react-router". v6: from "react-router-dom".
import { useLocation, useNavigate } from "react-router";
import type { RouterAdapter } from "@cairnkit/react";

export function useReactRouterAdapter(): RouterAdapter {
  const navigate = useNavigate();

  return {
    usePathname: () => useLocation().pathname,
    navigate: (href) => navigate(href),
  };
}
EOF
cat > src/App.tsx <<'EOF'
import { BrowserRouter, Routes } from "react-router";
import { CairnProvider } from "@cairnkit/react";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";
import { useReactRouterAdapter } from "./router-adapter";
import { flows } from "../walkthrough/flows";

function Shell() {
  return (
    <CairnProvider flows={flows} router={useReactRouterAdapter()}>
      <Routes>{/* your routes */}</Routes>
      <CairnOverlay />
      <TourLauncher flowId="onboarding" />
    </CairnProvider>
  );
}

export const App = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
);
EOF
compile "react + react-router v7" react-router@7.1.0

# ── React, no router — /docs/react ───────────────────────────────────
mkdir -p "$ROOT/norouter/src"; cd "$ROOT/norouter"
echo '{"name":"d","private":true,"dependencies":{"react":"19.0.0","react-dom":"19.0.0"}}' > package.json
echo "$TSCONFIG" > tsconfig.json
shared
cat > src/App.tsx <<'EOF'
import { CairnProvider, memoryRouter } from "@cairnkit/react";
import { CairnOverlay } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";
import { flows } from "../walkthrough/flows";

export function App() {
  return (
    <CairnProvider flows={flows} router={memoryRouter}>
      <main>{/* your app */}</main>
      <CairnOverlay />
    </CairnProvider>
  );
}
EOF
compile "react, no router"

echo ""
printf "  %d passed, %d failed\n\n" "$PASS" "$FAIL"
rm -rf "$ROOT"
[ "$FAIL" -eq 0 ]
