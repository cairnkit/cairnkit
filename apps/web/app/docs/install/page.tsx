import { DocPage } from "@/components/docs/doc-page";
import { Callout, C, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "Installation" };

export default function Page() {
  return (
    <DocPage
      slug="install"
      toc={[
        { id: "packages", label: "Packages" },
        { id: "support", label: "Supported versions" },
        { id: "register", label: "Register your types" },
        { id: "mount", label: "Mount the provider" },
        { id: "check", label: "Wire up the check" },
      ]}
    >
      <H2 id="packages">Packages</H2>
      <Code>{`npm i @cairnkit/core @cairnkit/react @cairnkit/ui @cairnkit/next
npm i -D @cairnkit/cli`}</Code>
      <Callout kind="note" title="Why core is in that list">
        <C>@cairnkit/react</C> depends on <C>@cairnkit/core</C> anyway, so npm users get it
        hoisted whether they ask for it or not. pnpm does not hoist, and the typed-anchor
        registry below augments <C>@cairnkit/core</C> by name — so without it installed
        directly, that augmentation does not compile. Listing it explicitly keeps the two
        package managers behaving the same.
      </Callout>
      <Ul>
        <li><C>@cairnkit/react</C> pulls in <C>core</C> — you rarely install it directly.</li>
        <li><C>@cairnkit/ui</C> is the prebuilt overlay. Skip it if you are building your own.</li>
        <li><C>@cairnkit/next</C> is the router adapter. Use your own for other routers.</li>
      </Ul>
      <Callout kind="warn" title="TypeScript 7">
        Next 15 does not support the TypeScript 7 native compiler. If <C>npm i -D typescript</C>{" "}
        gives you 7.x, pin <C>typescript@^5.7</C> until Next 16.
      </Callout>

      <H2 id="support">Supported versions</H2>
      <PropsTable
        rows={[
          { name: "React", type: "18 · 19", description: "Verified by building a real app on both. Needs useSyncExternalStore, so 18 is the floor." },
          { name: "Next.js", type: "14 · 15 · 16", description: "App Router and Pages Router. Verified against 14.2, 15.5 and 16.3." },
          { name: "Vite / react-router", type: "any", description: "Router access is a ten-line adapter — see the React page." },
          { name: "Node (for the CLI)", type: ">= 18", description: "cairn check and the audit helper." },
        ]}
      />
      <Callout kind="good" title="No React 19-only APIs">
        Nothing in Cairn uses <C>use()</C>, actions, or any other React 19 addition, which is why 18
        works rather than merely being declared.
      </Callout>

      <H2 id="register">Register your types</H2>
      <P>
        Optional, but it is what turns every anchor and flow id into a checked literal instead of a
        string.
      </P>
      <Code file="app/cairn.d.ts">{`import type { anchors } from "./anchors";

declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "upgrade-plan";
    events: "plan:upgraded";
  }
}`}</Code>

      <H2 id="mount">Mount the provider</H2>
      <Code file="app/providers.tsx">{`"use client";

import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";
import { upgradeFlow } from "./flows";

export function Providers({ children }) {
  return (
    <CairnProvider
      flows={[upgradeFlow]}
      router={useAppRouterAdapter()}
      onEvent={(e) => analytics.capture(e.name, e.props)}
    >
      {children}
      <CairnOverlay />
      <TourLauncher flowId="upgrade-plan" />
    </CairnProvider>
  );
}`}</Code>
      <Callout kind="warn" title="The overlay is not optional">
        Without <C>{"<CairnOverlay />"}</C> the provider mounts, the store runs, and nothing appears
        on screen. It is the most common setup mistake.
      </Callout>

      <H2 id="check">Wire up the check</H2>
      <Code file="package.json">{`"scripts": {
  "lint": "eslint . && cairn check src"
}`}</Code>
    </DocPage>
  );
}
