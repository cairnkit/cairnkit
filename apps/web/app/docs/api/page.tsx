import { DocPage } from "@/components/docs/doc-page";
import { C, H2, H3, P } from "@/components/docs/prose";
import { PropsTable } from "@/components/docs/props-table";
import { Code } from "@/components/docs/code";

export const metadata = { title: "API reference" };

export default function Page() {
  return (
    <DocPage
      slug="api"
      toc={[
        { id: "core", label: "@cairnkit/core" },
        { id: "react", label: "@cairnkit/react" },
        { id: "ui", label: "@cairnkit/ui" },
        { id: "next", label: "@cairnkit/next" },
        { id: "cli", label: "@cairnkit/cli" },
      ]}
    >
      <H2 id="core">@cairnkit/core</H2>
      <P>Framework-free engine. Zero runtime dependencies.</P>
      <PropsTable
        rows={[
          { name: "defineAnchors(registry)", type: "<T>(T) => T", description: "Declares the anchor registry. Identity at runtime; exists for type inference." },
          { name: "anchor(id)", type: "(id) => props", description: "Props object to spread onto an element." },
          { name: "anchorSelector(id)", type: "(id) => string", description: "The CSS selector for an anchor, escaped." },
          { name: "resolveAnchor(id, doc?)", type: "(id) => HTMLElement | null", description: "Finds the visible element for an anchor. Returns null on the server." },
          { name: "defineFlow(flow)", type: "(TourFlow) => TourFlow", description: "Declares a flow." },
          { name: "createFlowRegistry(flows)", type: "(TourFlow[]) => Registry", description: "Builds an id → flow map." },
          { name: "getFlow(registry, id)", type: "(...) => TourFlow | null", description: "Looks a flow up by id." },
          { name: "resolveResumeStep(flow, path, i)", type: "(...) => number | null", description: "Where to resume when the user is ahead. Pure, testable." },
          { name: "decideForRoute(flow, path, i)", type: "(...) => RouteDecision", description: "handoff / pause / resume / none, in that order." },
          { name: "createTourStore(options)", type: "(...) => TourStore", description: "Observable store, useSyncExternalStore-ready." },
          { name: "createActionRegistry()", type: "() => ActionRegistry", description: "Backs ctx.run in step hooks. One per provider — never module-level, which would leak across SSR requests." },
          { name: "localStoragePersist(key?)", type: "(key?) => PersistAdapter", description: "Default persistence. Progress must survive a page transition." },
          { name: "emitTourEvent(name)", type: "(name) => void", description: "Signal from your app that a step is waiting on." },
          { name: "onTourEvent(name, fn)", type: "(...) => () => void", description: "Subscribe. Returns an unsubscribe." },
          { name: "readRect / rectsEqual", type: "helpers", description: "Measure and compare a target rect." },
          { name: "watchForAnchor(id, ms, cb)", type: "(...) => () => void", description: "Wait for a late-mounting anchor." },
          { name: "scrollAnchorIntoView(el)", type: "(el) => void", description: "Reduced-motion aware." },
        ]}
      />
      <H3 id="core-types">Key types</H3>
      <Code>{`TourFlow · TourStep · AdvanceRule · Placement · AnchorId
CairnRegister · RegisteredAnchor · RegisteredFlowId · RegisteredEvent · RegisteredAction
StepContext · ActionRegistry · TourAction
CairnEvent · CairnEventHandler · TargetRect · TourStore · PersistAdapter`}</Code>

      <H2 id="react">@cairnkit/react</H2>
      <P>Headless bindings. No styling.</P>
      <PropsTable
        rows={[
          { name: "<CairnProvider>", type: "component", description: "Mounts the runtime. Props: flows, router, translate, onEvent, onNotice, store, mobileBreakpoint." },
          { name: "useTour()", type: "hook", description: "The controller — flow, step, rect, element, status, advance, back, skip, start, stop." },
          { name: "useTourState(selector)", type: "hook", description: "Subscribe to a slice of store state." },
          { name: "useStepCopy(flow, step)", type: "hook", description: "Resolves title and body, inline or via translate." },
          { name: "useTourDeepLink(param?)", type: "hook", description: "Starts a flow from ?tour=. Each value honoured once." },
          { name: "useCairn()", type: "hook", description: "Raw context — flows, router, store." },
          { name: "useTourAction(name, fn)", type: "hook", description: "Publishes an action a step can call via ctx.run, for as long as the component is mounted." },
          { name: "<TourAnchor id>", type: "component", description: "Escape hatch for components that swallow props." },
        ]}
      />
      <P>
        Also re-exports <C>defineFlow</C>, <C>defineAnchors</C>, <C>anchor</C> and the flow types
        from <C>@cairnkit/core</C>, so authoring a tour needs one import rather than two. Note
        that augmenting <C>CairnRegister</C> still has to target <C>@cairnkit/core</C> — an
        interface cannot be merged through a re-export — which is why core is a direct
        dependency in the install command.
      </P>

      <H2 id="ui">@cairnkit/ui</H2>
      <P>Prebuilt overlay. Plain prefixed CSS, light and dark.</P>
      <PropsTable
        rows={[
          { name: "<CairnOverlay>", type: "component", description: "Spotlight plus tooltip card. Props: labels, mobileBreakpoint, onNotice." },
          { name: "<TourLauncher>", type: "component", description: "The launcher. Props: flowId, label, position, pulse, icon, className." },
          { name: "<Spotlight>", type: "component", description: "Scrim and cutout only." },
          { name: "<StepCard>", type: "component", description: "The card only." },
          { name: "<Launcher>", type: "component", description: "Presentational launcher, unbound to a flow." },
          { name: "<ProgressRail>", type: "component", description: "Segmented step progress." },
          { name: "@cairnkit/ui/styles.css", type: "stylesheet", description: "Import once. Required for the prebuilt components." },
        ]}
      />

      <H2 id="next">@cairnkit/next</H2>
      <PropsTable
        rows={[
          { name: "useAppRouterAdapter()", type: "hook", description: "App Router adapter." },
          { name: "usePagesRouterAdapter()", type: "hook", description: "Pages Router adapter." },
        ]}
      />

      <H2 id="cli">@cairnkit/cli</H2>
      <PropsTable
        rows={[
          { name: "cairn check <dir>", type: "command", description: "Static drift check. Exits 1 on any finding." },
          { name: "auditFlow(page, opts)", type: "function", description: "Drives one flow in a browser and reports per-step." },
          { name: "auditFlows(page, list)", type: "function", description: "Several flows; throws one readable error if any fail." },
        ]}
      />
    </DocPage>
  );
}
