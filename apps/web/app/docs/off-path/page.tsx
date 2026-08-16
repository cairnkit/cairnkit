import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "When users go off-script" };

export default function Page() {
  return (
    <DocPage
      slug="off-path"
      toc={[
        { id: "problem", label: "Why this exists" },
        { id: "fields", label: "The four fields" },
        { id: "resume", label: "resumeAt" },
        { id: "handoff", label: "handoffRoutes" },
        { id: "pause", label: "pauseRoutes" },
        { id: "leaving", label: "Leaving a step's page" },
        { id: "scope", label: "scope" },
        { id: "rules", label: "Rules and precedence" },
      ]}
    >
      <H2 id="problem">Why this exists</H2>
      <P>
        Because the guide points at real controls, users operate them <em>before</em> the step that
        describes them. When that navigates, every anchor on the old page disappears at once, and a
        naive tour dies on a screen the user is no longer looking at.
      </P>
      <P>
        These fields are the difference between a tour that survives real behaviour and one that
        only works if you follow it exactly.
      </P>

      <H2 id="fields">The four fields</H2>
      <PropsTable
        rows={[
          {
            name: "resumeAt",
            type: "{ pathname; stepIndex }[]",
            description: "They got ahead of the guide — catch up. Forward only.",
          },
          {
            name: "handoffRoutes",
            type: "{ pathname; flowId }[]",
            description: "Another guide covers this route — switch to it.",
          },
          {
            name: "pauseRoutes",
            type: "string[]",
            description: "Nobody covers this route — sleep, keep their place.",
          },
          {
            name: "scope",
            type: "string",
            description: "Not a route at all — a tab or stage. Sleep when it is not in front.",
          },
        ]}
      />

      <H2 id="resume">resumeAt</H2>
      <P>
        The user clicks &ldquo;Create manually&rdquo; while the guide is still describing the cards
        above it. Landing on the form resumes at the first form step.
      </P>
      <Code>{`resumeAt: [{ pathname: "/questions/new", stepIndex: 6 }]`}</Code>
      <Callout kind="warn" title="Forward only, deliberately">
        Rewinding someone already deep in a form would show copy that no longer describes their
        state — worse than ending. If the target index is not ahead of the current step, nothing
        happens.
      </Callout>

      <H2 id="handoff">handoffRoutes</H2>
      <P>
        Some routes are a <em>different way of doing the same job</em>, not a wrong turn. Writing a
        question by hand and generating one with AI are siblings. Choosing the second mid-tour
        should switch guides, not punish the user.
      </P>
      <Code>{`handoffRoutes: [{ pathname: "/questions/ai", flowId: "create-with-ai" }]`}</Code>

      <H2 id="pause">pauseRoutes</H2>
      <P>
        The tour goes dormant: no overlay, no anchor hunting, no &ldquo;we lost the step&rdquo;
        message. Returning to a covered route resumes on the same step.
      </P>
      <Code>{`pauseRoutes: ["/settings", "/billing"]`}</Code>
      <Callout kind="good" title="Pauses, never ends">
        Glancing at another page should cost the user nothing. An earlier version of cairnkit ended
        the tour here, which treated a legitimate choice as a mistake.
      </Callout>

      <H2 id="leaving">Leaving the page a step lives on</H2>
      <P>
        None of the fields above are needed for the commonest case of all: the user presses the
        browser Back button, or follows a link, while the guide is mid-flow on another page.
      </P>
      <P>
        cairnkit records the pathname each step became active on. When a step&rsquo;s anchor goes
        missing it compares the two:
      </P>
      <Ul>
        <li>
          <strong>Missing on the page it lives on</strong> — the element is genuinely gone. The tour
          ends and says so.
        </li>
        <li>
          <strong>Missing because you left that page</strong> — the tour goes dormant and keeps your
          place. Coming back wakes it on the same step.
        </li>
      </Ul>
      <P>
        The <C>Back</C> button on the step card disappears while the previous step is unreachable
        from here, since pressing it would land nowhere. A previous step with an <C>onEnter</C> is
        exempt — that hook exists to restore the modal or panel its anchor lives in, so absence
        right now proves nothing.
      </P>

      <H2 id="scope">scope</H2>
      <P>
        Everything above is keyed on the pathname. Tabs break that: two guides live at one URL, and
        switching between them changes nothing the router can see. The running guide keeps pointing
        at a panel that just unmounted.
      </P>
      <P>
        A flow declares which part of the screen it belongs to, and the component that owns that
        state declares which part is in front:
      </P>
      <Code>{`// the flow
defineFlow({ id: "invite-by-email", scope: "email", /* … */ });
defineFlow({ id: "invite-by-link",  scope: "link",  /* … */ });

// the component that owns the tabs
function InvitePage() {
  const [tab, setTab] = useState<"email" | "link">("email");
  useTourScope(tab);
  // …
}`}</Code>
      <P>
        A guide whose scope is not in front goes dormant, exactly as <C>pauseRoutes</C> does for a
        route it does not cover — so switching back picks up on the step you left.
      </P>
      <Callout kind="warn" title="cairnkit cannot work this out on its own">
        The obvious shortcut is &ldquo;my anchor vanished, so I must have left&rdquo;. It does not
        hold. Anchors are routinely shared between tabs — one settings panel reused by both, a tab
        strip that belongs to neither — so a guide can survive the switch and describe the wrong
        feature with total confidence. That is worse than stopping, and it is why the app has to say
        where it is rather than have cairnkit guess.
      </Callout>
      <Callout kind="good" title="Opt in, per flow">
        A flow with no <C>scope</C> goes anywhere, and an app that never calls <C>useTourScope</C>{" "}
        is unconstrained. Nothing written before this existed behaves differently.
      </Callout>
      <Callout kind="warn" title="Do not switch tabs from onEnter">
        The obvious way to make a guide open its own tab is a first step whose <C>onEnter</C> does
        it. That deadlocks: a flow in the wrong scope is dormant, and a dormant step never runs{" "}
        <C>onEnter</C>, so the hook that would fix the scope can never fire. A deep link straight
        into the second tab&rsquo;s guide would sit paused behind the first tab forever.
        <br />
        <br />
        The tab is the app&rsquo;s state, so the app moves it. Watch the active flow and bring its
        scope forward once, when the flow changes:
      </Callout>
      <Code>{`const { flow } = useActiveTour();
const launched = useRef<string | null>(null);

useEffect(() => {
  if (flow?.id === launched.current) return;
  launched.current = flow?.id ?? null;
  if (flow?.scope) setTab(flow.scope);
}, [flow]);`}</Code>
      <P>
        Keyed on the flow changing rather than re-asserted every render, or it would drag the user
        back each time they switched tabs mid-tour. Switching away is allowed — it is what sends the
        guide to sleep.
      </P>
      <P>
        While a guide is dormant, a <C>TourLauncher</C> for a <em>different</em> flow becomes
        visible — that is how the user reaches the guide covering the tab they just opened. The
        dormant flow&rsquo;s own launcher stays hidden, since restarting it would throw away the
        progress it is holding.
      </P>

      <H2 id="rules">Rules and precedence</H2>
      <P>Evaluated in this order, in one place:</P>
      <Ul>
        <li>
          <strong>out of scope</strong> — the wrong tab is in front, so nothing else matters
        </li>
        <li>
          <strong>handoff</strong> — another guide owns this route
        </li>
        <li>
          <strong>pause</strong> — nobody covers it
        </li>
        <li>
          <strong>resume</strong> — the user got ahead
        </li>
      </Ul>
      <Callout kind="warn" title="Two constraints the CLI enforces">
        A route must not appear in both <C>pauseRoutes</C> and <C>handoffRoutes</C>, and no flow may
        hand off to itself. Both would be ambiguous, so <C>cairnkit check</C> rejects them rather than
        letting the engine guess.
      </Callout>
      <P>
        <strong>
          Any branch in your UI needs steps, a <C>resumeAt</C>, a <C>handoffRoutes</C>, a{" "}
          <C>pauseRoutes</C> entry, or a <C>scope</C>.
        </strong>{" "}
        This is the failure mode neither the lint check nor the browser audit can catch, because
        every anchor genuinely exists — just not on the page, or the tab, the user chose.
      </P>
    </DocPage>
  );
}
