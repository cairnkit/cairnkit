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
      <P>
        Or let the CLI do it. It detects your framework, writes those files into{" "}
        <C>src/walkthrough/</C>, and prints the three steps it deliberately leaves to you:
      </P>
      <Code>{`npx cairnkit init

  --dir <path>   where the files go. Defaults to src/walkthrough
  --dry-run      print the whole plan and write nothing`}</Code>
      <P>
        It reads your framework, whether source sits under <C>src/</C>, your tsconfig path alias and
        your package manager, then writes an anchor registry, a starter flow, the type registry and
        a provider. It never overwrites a file, and running it twice does nothing.
      </P>
      <Callout kind="note" title="It will not touch your layout">
        Mounting the provider is the step it prints rather than performs. Rewriting someone
        else&apos;s root layout on first contact is not worth the minute it saves — if the edit goes
        wrong there is nothing to undo. The paths in the sections below are written for a project
        doing this by hand; if you ran <C>init</C>, your files are already in{" "}
        <C>src/walkthrough/</C> and you only need the mounting step.
      </Callout>
      <P>
        JavaScript projects get JavaScript. You lose the type registry, which is the part that turns
        a rename into a compile error, and <C>init</C> says so rather than pretending otherwise.
      </P>
      <Callout kind="note" title="Why core is in that list">
        <C>@cairnkit/react</C> depends on <C>@cairnkit/core</C> anyway, so npm users get it hoisted
        whether they ask for it or not. pnpm does not hoist, and the typed-anchor registry below
        augments <C>@cairnkit/core</C> by name — so without it installed directly, that augmentation
        does not compile. Listing it explicitly keeps the two package managers behaving the same.
      </Callout>
      <Ul>
        <li>
          <C>@cairnkit/react</C> pulls in <C>core</C> — you rarely install it directly.
        </li>
        <li>
          <C>@cairnkit/ui</C> is the prebuilt overlay. Skip it if you are building your own.
        </li>
        <li>
          <C>@cairnkit/next</C> is the router adapter. Use your own for other routers.
        </li>
      </Ul>
      <Callout kind="warn" title="TypeScript 7">
        Next 15 does not support the TypeScript 7 native compiler. If <C>npm i -D typescript</C>{" "}
        gives you 7.x, pin <C>typescript@^5.7</C> until Next 16.
      </Callout>

      <H2 id="support">Supported versions</H2>
      <PropsTable
        rows={[
          {
            name: "React",
            type: "18 · 19",
            description:
              "Verified by building a real app on both. Needs useSyncExternalStore, so 18 is the floor.",
          },
          {
            name: "Next.js",
            type: "14 · 15 · 16",
            description: "App Router and Pages Router. Verified against 14.2, 15.5 and 16.3.",
          },
          {
            name: "Vite / react-router",
            type: "any",
            description: "Router access is a ten-line adapter — see the React page.",
          },
          {
            name: "Node (for the CLI)",
            type: ">= 18",
            description: "cairnkit check and the audit helper.",
          },
        ]}
      />
      <Callout kind="good" title="No React 19-only APIs">
        Nothing in cairnkit uses <C>use()</C>, actions, or any other React 19 addition, which is why
        18 works rather than merely being declared.
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

import type { ReactNode } from "react";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";
import { upgradeFlow } from "./flows";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CairnProvider flows={[upgradeFlow]} router={useAppRouterAdapter()}>
      {children}
      <CairnOverlay />
      <TourLauncher flowId="upgrade-plan" />
    </CairnProvider>
  );
}`}</Code>
      <P>
        Then wrap your app with it. The provider has to be an ancestor of every anchor — rendered as
        a sibling it supplies context to nothing, and every <C>useTour()</C> below throws.
      </P>
      <Code file="app/layout.tsx">{`import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`}</Code>
      <Callout kind="warn" title="The overlay is not optional">
        Without <C>{"<CairnOverlay />"}</C> the provider mounts, the store runs, and nothing appears
        on screen. It is the most common setup mistake.
      </Callout>

      <H2 id="check">Wire up the check</H2>
      <Code file="package.json">{`"scripts": {
  "lint": "eslint . && cairnkit check src"
}`}</Code>
    </DocPage>
  );
}
