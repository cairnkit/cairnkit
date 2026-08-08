import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, H3, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "When users go off-script" };

export default function Page() {
  return (
    <DocPage
      slug="off-path"
      toc={[
        { id: "problem", label: "Why this exists" },
        { id: "fields", label: "The three fields" },
        { id: "resume", label: "resumeAt" },
        { id: "handoff", label: "handoffRoutes" },
        { id: "pause", label: "pauseRoutes" },
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
        These three fields are the difference between a tour that survives real behaviour and one
        that only works if you follow it exactly.
      </P>

      <H2 id="fields">The three fields</H2>
      <PropsTable
        rows={[
          { name: "resumeAt", type: "{ pathname; stepIndex }[]", description: "They got ahead of the guide — catch up. Forward only." },
          { name: "handoffRoutes", type: "{ pathname; flowId }[]", description: "Another guide covers this route — switch to it." },
          { name: "pauseRoutes", type: "string[]", description: "Nobody covers this route — sleep, keep their place." },
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
        Glancing at another page should cost the user nothing. An earlier version of Cairn ended the
        tour here, which treated a legitimate choice as a mistake.
      </Callout>

      <H2 id="rules">Rules and precedence</H2>
      <P>Evaluated in this order, in one place:</P>
      <Ul>
        <li><strong>handoff</strong> — another guide owns this route</li>
        <li><strong>pause</strong> — nobody covers it</li>
        <li><strong>resume</strong> — the user got ahead</li>
      </Ul>
      <Callout kind="warn" title="Two constraints the CLI enforces">
        A route must not appear in both <C>pauseRoutes</C> and <C>handoffRoutes</C>, and no flow may
        hand off to itself. Both would be ambiguous, so <C>cairn check</C> rejects them rather than
        letting the engine guess.
      </Callout>
      <P>
        <strong>Any branch in your UI needs steps, a <C>resumeAt</C>, a <C>handoffRoutes</C>, or a{" "}
        <C>pauseRoutes</C> entry.</strong> This is the failure mode neither the lint check nor the
        browser audit can catch, because every anchor genuinely exists — just not on the page the
        user chose.
      </P>
    </DocPage>
  );
}
