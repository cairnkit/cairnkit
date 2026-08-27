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
        { id: "cloud", label: "@cairnkit/cloud" },
        { id: "cli", label: "@cairnkit/cli" },
      ]}
    >
      <H2 id="core">@cairnkit/core</H2>
      <P>Framework-free engine. Zero runtime dependencies.</P>
      <PropsTable
        rows={[
          {
            name: "defineAnchors(registry)",
            type: "<T>(T) => T",
            description:
              "Declares the anchor registry. Identity at runtime; exists for type inference.",
          },
          {
            name: "anchor(id)",
            type: "(id) => props",
            description: "Props object to spread onto an element.",
          },
          {
            name: "anchorSelector(id)",
            type: "(id) => string",
            description: "The CSS selector for an anchor, escaped.",
          },
          {
            name: "resolveAnchor(id, doc?)",
            type: "(id) => HTMLElement | null",
            description: "Finds the visible element for an anchor. Returns null on the server.",
          },
          {
            name: "defineFlow(flow)",
            type: "(TourFlow) => TourFlow",
            description: "Declares a flow.",
          },
          {
            name: "createFlowRegistry(flows)",
            type: "(TourFlow[]) => Registry",
            description: "Builds an id → flow map.",
          },
          {
            name: "getFlow(registry, id)",
            type: "(...) => TourFlow | null",
            description: "Looks a flow up by id.",
          },
          {
            name: "resolveResumeStep(flow, path, i)",
            type: "(...) => number | null",
            description: "Where to resume when the user is ahead. Pure, testable.",
          },
          {
            name: "decideForRoute(flow, path, i)",
            type: "(...) => RouteDecision",
            description: "handoff / pause / resume / none, in that order.",
          },
          {
            name: "createTourStore(options)",
            type: "(...) => TourStore",
            description: "Observable store, useSyncExternalStore-ready.",
          },
          {
            name: "createActionRegistry()",
            type: "() => ActionRegistry",
            description:
              "Backs ctx.run in step hooks. One per provider — never module-level, which would leak across SSR requests.",
          },
          {
            name: "localStoragePersist(key?)",
            type: "(key?) => PersistAdapter",
            description: "Default persistence. Progress must survive a page transition.",
          },
          {
            name: "emitTourEvent(name)",
            type: "(name) => void",
            description: "Signal from your app that a step is waiting on.",
          },
          {
            name: "onTourEvent(name, fn)",
            type: "(...) => () => void",
            description: "Subscribe. Returns an unsubscribe.",
          },
          {
            name: "readRect / rectsEqual",
            type: "helpers",
            description: "Measure and compare a target rect.",
          },
          {
            name: "watchForAnchor(id, ms, cb)",
            type: "(...) => () => void",
            description: "Wait for a late-mounting anchor.",
          },
          {
            name: "scrollAnchorIntoView(el)",
            type: "(el) => void",
            description: "Reduced-motion aware.",
          },
        ]}
      />
      <H3 id="core-types">Key types</H3>
      <Code>{`TourFlow · TourStep · AdvanceRule · Placement · AnchorId
CairnRegister · RegisteredAnchor · RegisteredFlowId · RegisteredEvent · RegisteredAction
StepContext · ActionRegistry · TourAction
CairnEvent · CairnEventHandler · TargetRect · TourStore · PersistAdapter
TourDismissReason · TourExitReason`}</Code>

      <H3 id="core-events">Events</H3>
      <P>
        One <C>onEvent</C> callback receives every signal a tour emits. Point it at your analytics,
        or at <C>@cairnkit/cloud</C>.
      </P>
      <PropsTable
        rows={[
          {
            name: "flow_started",
            type: "flowId, version",
            description: "A tour began.",
          },
          {
            name: "step_viewed",
            type: "flowId, stepIndex, anchor",
            description: "One per step, however many times it re-renders.",
          },
          {
            name: "flow_completed",
            type: "flowId, version",
            description: "Reached the end.",
          },
          {
            name: "flow_dismissed",
            type: "flowId, version, stepIndex, reason",
            description:
              "Left early. reason is 'skipped' (the Skip button), 'closed' (the X) or 'escape'. Three different intents kept apart because they argue for opposite fixes: a step people skip is unwanted, a step people close is usually one whose card covers what they were trying to see.",
          },
          {
            name: "flow_handoff",
            type: "fromFlowId, toFlowId, pathname",
            description: "One tour handed off to another.",
          },
          {
            name: "anchor_missing",
            type: "flowId, stepIndex, anchor, pathname, optional?",
            description:
              "A step pointed at UI that was not on the page — what cairnkit check catches before release, seen from production. `optional: true` is set when the step declared itself optional, so an expected absence can be told from a break: count these as breakage and a guide skipping a step exactly as intended reads as a broken anchor. Absent, never false, on a required step.",
          },
          {
            name: "step_feedback",
            type: "flowId, stepIndex, clear, note",
            description: "A reader said whether the step made sense.",
          },
        ]}
      />

      <P>
        Every event is <C>{"{ name, props }"}</C>, so the callback maps onto an analytics client
        directly. Nothing below needs an account with us.
      </P>
      <Code file="app/providers.tsx">{`<CairnProvider
  flows={flows}
  onEvent={(event) => posthog.capture(event.name, event.props)}
>
  {children}
</CairnProvider>`}</Code>
      <P>
        Segment, Amplitude, Mixpanel and a plain <C>fetch</C> to your own collector take the same
        shape. To send to a tool and to cloud, call both:
      </P>
      <Code file="app/providers.tsx">{`import { sendToCloud } from "@cairnkit/cloud";

// Calls sharing a key share one transport, so an inline call during render is
// also correct. Named here only because it is used alongside another handler.
const toCloud = sendToCloud({ key: process.env.NEXT_PUBLIC_CAIRNKIT_KEY! });

<CairnProvider
  flows={flows}
  onEvent={(event) => {
    posthog.capture(event.name, event.props);
    toCloud(event);
  }}
>`}</Code>

      <H2 id="react">@cairnkit/react</H2>
      <P>Headless bindings. No styling.</P>
      <PropsTable
        rows={[
          {
            name: "<CairnProvider>",
            type: "component",
            description:
              "Mounts the runtime. Props: flows, router, translate, onEvent, onNotice, store, mobileBreakpoint.",
          },
          {
            name: "useTour()",
            type: "hook",
            description:
              "The controller: flow, step, rect, element, status, advance, back, skip, start, stop. Mount it once: it binds listeners and fires lifecycle hooks.",
          },
          {
            name: "useActiveTour()",
            type: "hook",
            description:
              "Read-only view: flow, stepIndex, pathname, decision, isPaused. No side effects, so it is safe beside useTour.",
          },
          {
            name: "useStartTour()",
            type: "hook",
            description: "Just the starter, without the driver. What a custom launcher wants.",
          },
          {
            name: "useTourScope(scope)",
            type: "hook",
            description: "Declares which tab or stage is in front, for flows that carry a scope.",
          },
          {
            name: "useTourState(selector)",
            type: "hook",
            description: "Subscribe to a slice of store state.",
          },
          {
            name: "useStepCopy(flow, step)",
            type: "hook",
            description: "Resolves title and body, inline or via translate.",
          },
          {
            name: "useTourDeepLink(param?)",
            type: "hook",
            description: "Starts a flow from ?tour=. Each value honoured once.",
          },
          { name: "useCairn()", type: "hook", description: "Raw context: flows, router, store." },
          {
            name: "useTourAction(name, fn)",
            type: "hook",
            description:
              "Publishes an action a step can call via ctx.run, for as long as the component is mounted.",
          },
          {
            name: "useAnchorTarget(id, opts)",
            type: "hook",
            description:
              "Resolves one anchor to a live element and rect, and reports status while it waits. What useTour drives internally; useful when building your own overlay. Options: waitForMs, enabled, resetKey.",
          },
          {
            name: "memoryRouter",
            type: "adapter",
            description:
              "For an app with no router, and the default in tests. Reads window.location.pathname and navigates with window.location.assign. Prefer it over hand-writing an adapter that returns a fixed path.",
          },
          {
            name: "<TourAnchor id>",
            type: "component",
            description: "Escape hatch for components that swallow props.",
          },
        ]}
      />
      <P>
        Also re-exports <C>defineFlow</C>, <C>defineAnchors</C>, <C>anchor</C> and the flow types
        from <C>@cairnkit/core</C>, so authoring a tour needs one import rather than two. Note that
        augmenting <C>CairnRegister</C> still has to target <C>@cairnkit/core</C> — an interface
        cannot be merged through a re-export — which is why core is a direct dependency in the
        install command.
      </P>

      <H2 id="ui">@cairnkit/ui</H2>
      <P>Prebuilt overlay. Plain prefixed CSS, light and dark.</P>
      <PropsTable
        rows={[
          {
            name: "<CairnOverlay>",
            type: "component",
            description: "Spotlight plus tooltip card. Props: labels, mobileBreakpoint, onNotice.",
          },
          {
            name: "<TourLauncher>",
            type: "component",
            description: "The launcher. Props: flowId, label, position, pulse, icon, className.",
          },
          { name: "<Spotlight>", type: "component", description: "Scrim and cutout only." },
          { name: "<StepCard>", type: "component", description: "The card only." },
          {
            name: "<Launcher>",
            type: "component",
            description: "Presentational launcher, unbound to a flow.",
          },
          { name: "<ProgressRail>", type: "component", description: "Segmented step progress." },
          {
            name: "<CairnNoticeBar>",
            type: "component",
            description:
              "Renders the notices the provider raises, such as an anchor that never appeared. Props: labels.",
          },
          {
            name: "<Button>",
            type: "component",
            description: "The card's own button, exported so a custom card can match it.",
          },
          {
            name: "<IconButton>",
            type: "component",
            description: "Icon-only variant, used for dismiss.",
          },
          {
            name: "@cairnkit/ui/styles.css",
            type: "stylesheet",
            description: "Import once. Required for the prebuilt components.",
          },
        ]}
      />

      <H2 id="next">@cairnkit/next</H2>
      <PropsTable
        rows={[
          { name: "useAppRouterAdapter()", type: "hook", description: "App Router adapter." },
          {
            name: "usePagesRouterAdapter()",
            type: "hook",
            description:
              "Pages Router adapter. Reads router.asPath, not router.pathname, so it reports the resolved path rather than the route pattern.",
          },
          {
            name: "appRouterAdapter()",
            type: "function",
            description:
              "Non-hook form, kept for callers that cannot use a hook. Prefer useAppRouterAdapter: this one calls useRouter inside navigate, which breaks the rules of hooks.",
          },
        ]}
      />

      <H2 id="cloud">@cairnkit/cloud</H2>
      <P>
        Optional. Reports the events the library already emits to cairnkit cloud. Nothing else in
        the library depends on it.
      </P>
      <PropsTable
        rows={[
          {
            name: "sendToCloud(opts)",
            type: "function",
            description:
              "Returns an onEvent handler for CairnProvider. Options: key, and optionally endpoint. Batches and sends with sendBeacon.",
          },
          {
            name: "reportFlows(opts)",
            type: "function",
            description:
              "Sends the flow and step copy once per locale, so the dashboard can name a step instead of numbering it. Deduped on a fingerprint of the content, so a locale switch reports again. Options: key, flows, locale.",
          },
          {
            name: "currentSession()",
            type: "function",
            description:
              "The current session id, from localStorage, rotating after an idle gap. Exported because a custom transport needs the same id the built-in one uses.",
          },
        ]}
      />

      <H2 id="cli">@cairnkit/cli</H2>
      <PropsTable
        rows={[
          {
            name: "cairnkit check <dir>",
            type: "command",
            description: "Static drift check. Exits 1 on any finding.",
          },
          {
            name: "cairnkit status <dir>",
            type: "command",
            description:
              "Describe every anchor: whether an element carries it, how it was applied, where it was declared, and which flows point at it. Always exits 0 — describing is not judging.",
          },
          {
            name: "--json",
            type: "flag",
            description:
              "On check or status. Writes exactly one JSON object to stdout and every human-facing message to stderr, so the output pipes straight into a parser. The payload carries a version field.",
          },
          {
            name: "auditFlow(page, opts)",
            type: "function",
            description: "Drives one flow in a browser and reports per-step.",
          },
          {
            name: "auditFlows(page, list)",
            type: "function",
            description: "Several flows; throws one readable error if any fail.",
          },
        ]}
      />
    </DocPage>
  );
}
