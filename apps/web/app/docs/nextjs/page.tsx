import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, H3, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";

export const metadata = { title: "Next.js" };

export default function Page() {
  return (
    <DocPage
      slug="nextjs"
      toc={[
        { id: "app-router", label: "App Router" },
        { id: "pages-router", label: "Pages Router" },
        { id: "ssr", label: "Server rendering" },
        { id: "deeplink", label: "Deep links" },
        { id: "gotchas", label: "Known gotchas" },
      ]}
    >
      <Callout kind="note" title="Read these first">
        This page covers only the wiring for your framework. The anchor registry and the flow it
        points at are the same everywhere and are defined on <a href="/docs/anchors">Anchors</a> and{" "}
        <a href="/docs/flows">Flows and steps</a>. Or skip both and run <C>npx cairnkit init</C>,
        which writes them for you.
      </Callout>

      <H2 id="app-router">App Router</H2>
      <P>
        The provider is a client component. Put it in its own file so your layout can stay a server
        component.
      </P>
      <Code file="app/providers.tsx">{`"use client";

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
}`}</Code>
      <Code file="app/layout.tsx">{`import { Providers } from "./providers";
import "@cairnkit/ui/styles.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}`}</Code>

      <H2 id="pages-router">Pages Router</H2>
      <P>
        Same shape, different adapter. Wrap in <C>_app</C>.
      </P>
      <Code file="pages/_app.tsx">{`import type { AppProps } from "next/app";
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
}`}</Code>

      <H2 id="ssr">Server rendering</H2>
      <P>
        The overlay renders nothing on the server and mounts through a portal after hydration, so
        there is no markup mismatch. <C>resolveAnchor</C> returns <C>null</C> when there is no{" "}
        <C>document</C> rather than throwing, so importing Cairn from a server component is safe.
      </P>
      <Callout kind="good" title="Anchors are server-safe">
        <C>anchor()</C> just returns a props object, so you can spread it in a server component.
        Only the provider and overlay need <C>&quot;use client&quot;</C>.
      </Callout>

      <H2 id="deeplink">Deep links</H2>
      <P>
        <C>useTourDeepLink()</C> starts a flow from <C>?tour=&lt;flowId&gt;</C>, so support can send
        someone straight into a guide.
      </P>
      <Code>{`"use client";
import { useTourDeepLink } from "@cairnkit/react";

export function DeepLink() {
  useTourDeepLink();   // or useTourDeepLink("guide") for ?guide=
  return null;
}`}</Code>
      <Callout kind="note" title="No Suspense boundary needed">
        It reads <C>window.location.search</C> rather than <C>useSearchParams</C>. That hook opts
        its whole subtree out of prerendering and needs its own Suspense boundary; going through the
        DOM avoids both, and works in any framework.
      </Callout>

      <H2 id="gotchas">Known gotchas</H2>
      <Ul>
        <li>
          <strong>TypeScript 7.</strong> Next 15 rejects the native TS7 compiler. Pin{" "}
          <C>typescript@^5.7</C> until Next 16.
        </li>
        <li>
          <strong>Turbopack and workspace packages.</strong> Developing Cairn alongside your app
          needs <C>transpilePackages</C> in <C>next.config.ts</C>. Not needed when installing from
          npm.
        </li>
        <li>
          <strong>Route changes are asynchronous.</strong> Anchors are waited for, so a step whose
          action navigates just works — see <Link href="/docs/off-path">going off-script</Link>.
        </li>
      </Ul>
    </DocPage>
  );
}
