import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";

export const metadata = { title: "React" };

export default function Page() {
  return (
    <DocPage
      slug="react"
      toc={[
        { id: "adapter", label: "The router adapter" },
        { id: "react-router", label: "react-router" },
        { id: "tanstack", label: "TanStack Router" },
        { id: "norouter", label: "No router at all" },
        { id: "mount", label: "Mounting" },
        { id: "vite", label: "Vite notes" },
      ]}
    >
      <Callout kind="note" title="Read these first">
        This page covers only the wiring for your framework. The anchor registry and the flow it
        points at are the same everywhere and are defined on <a href="/docs/anchors">Anchors</a> and{" "}
        <a href="/docs/flows">Flows and steps</a>. Or skip both and run <C>npx cairnkit init</C>,
        which writes them for you.
      </Callout>

      <H2 id="adapter">The router adapter</H2>
      <P>
        cairnkit is not a Next library. Everything route-related — <C>resumeAt</C>,{" "}
        <C>handoffRoutes</C>, <C>pauseRoutes</C>, the <C>route</C> advance rule — goes through one
        two-method interface.
      </P>
      <Code>{`type RouterAdapter = {
  usePathname(): string;
  navigate(href: string): void;
};`}</Code>
      <P>That is the entire surface. Any router is about ten lines.</P>

      <H2 id="react-router">react-router</H2>
      <Callout kind="warn" title="v6 and v7 are different packages">
        react-router v7 moved everything into <C>react-router</C>; <C>react-router-dom</C> is a
        compat shim that a v7 project may not have installed at all. Import from whichever one is in
        your <C>package.json</C> — the wrong one simply does not resolve.
      </Callout>
      <Code file="src/router-adapter.ts">{`// v7: import from "react-router". v6: from "react-router-dom".
import { useLocation, useNavigate } from "react-router";
import type { RouterAdapter } from "@cairnkit/react";

export function useReactRouterAdapter(): RouterAdapter {
  const navigate = useNavigate();

  return {
    usePathname: () => useLocation().pathname,
    navigate: (href) => navigate(href),
  };
}`}</Code>

      <H2 id="tanstack">TanStack Router</H2>
      <Code>{`import { useRouterState, useNavigate } from "@tanstack/react-router";
import type { RouterAdapter } from "@cairnkit/react";

export function useTanStackAdapter(): RouterAdapter {
  const navigate = useNavigate();

  return {
    usePathname: () => useRouterState({ select: (s) => s.location.pathname }),
    navigate: (href) => navigate({ to: href }),
  };
}`}</Code>

      <H2 id="norouter">No router at all</H2>
      <P>
        A single-page app with no routing still works, and you do not have to write an adapter for
        it. <C>memoryRouter</C> ships in the package and is the same object the test suite runs on.
      </P>
      <Code>{`import { CairnProvider, memoryRouter } from "@cairnkit/react";

<CairnProvider flows={flows} router={memoryRouter}>`}</Code>
      <P>
        It reads <C>window.location.pathname</C> on every render and navigates with{" "}
        <C>window.location.assign</C>. Every route feature is driven off that one value, so all of
        them work: the guide navigates, the browser loads the page, and the engine reads the new
        path and picks up where it should.
      </P>
      <Callout kind="note" title="What this costs">
        A full page load per navigation instead of a client-side transition, which is what a real
        router adapter buys you. Nothing is switched off: <C>resumeAt</C>, <C>handoffRoutes</C>,{" "}
        <C>pauseRoutes</C> and <C>route</C> steps all still fire, because each is evaluated against
        the pathname on the render after the load.
      </Callout>
      <Callout kind="warn" title="Do not hand-write a fixed pathname">
        An adapter whose <C>usePathname</C> returns a constant <C>&quot;/&quot;</C> looks equivalent
        and is not. It reports the wrong route on every page, so <C>pauseRoutes</C> never pauses,{" "}
        <C>resumeAt</C> never catches up, and a <C>route</C> step either fires immediately or never.
      </Callout>

      <H2 id="mount">Mounting</H2>
      <Code file="src/App.tsx">{`import { BrowserRouter } from "react-router";  // v6: react-router-dom
import { CairnProvider } from "@cairnkit/react";
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";
import { useReactRouterAdapter } from "./router-adapter";
import { flows } from "./walkthrough/flows";

function Shell() {
  return (
    <CairnProvider flows={flows} router={useReactRouterAdapter()}>
      <Routes>{/* ... */}</Routes>
      <CairnOverlay />
      <TourLauncher flowId="onboarding" />
    </CairnProvider>
  );
}

export const App = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
);`}</Code>
      <Callout kind="warn" title="Provider goes inside the router">
        The adapter calls router hooks, so <C>CairnProvider</C> must be a descendant of{" "}
        <C>BrowserRouter</C>. Outside it, <C>useNavigate</C> throws.
      </Callout>

      <H2 id="vite">Vite notes</H2>
      <Ul>
        <li>
          Import the stylesheet once, anywhere: <C>import &quot;@cairnkit/ui/styles.css&quot;</C>.
        </li>
        <li>
          If you develop cairnkit alongside your app via a workspace link, add{" "}
          <C>resolve.dedupe: [&quot;react&quot;, &quot;react-dom&quot;]</C> — symlinked packages can
          otherwise resolve a second copy of React and hooks break.
        </li>
      </Ul>
      <P>
        A complete working example lives in{" "}
        <a href="https://github.com/cairnkit/cairnkit/tree/main/examples/react-vite">
          examples/react-vite
        </a>
        .
      </P>
    </DocPage>
  );
}
