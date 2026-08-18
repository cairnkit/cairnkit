import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "cairnkit check" };

export default function Page() {
  return (
    <DocPage
      slug="ci"
      toc={[
        { id: "run", label: "Running it" },
        { id: "output", label: "Reading the output" },
        { id: "rules", label: "The rules" },
        { id: "status", label: "Seeing what is there" },
        { id: "ci", label: "In CI" },
        { id: "safe", label: "What it does not do" },
      ]}
    >
      <Callout kind="note" title="The other command">
        <C>@cairnkit/cli</C> also ships <C>cairnkit init</C>, which scaffolds anchors, a flow and a
        provider into an existing app. See <a href="/docs/install">Installation</a>.
      </Callout>

      <H2 id="run">Running it</H2>
      <Code>{`npx cairnkit check`}</Code>
      <P>
        The path defaults to <C>src</C>. Pass one or more directories if your code lives elsewhere
        or spans several roots — everything is scanned as a single project, so a flow in one
        directory can point at a component in another:
      </P>
      <Code>{`npx cairnkit check src
npx cairnkit check src app packages/ui`}</Code>
      <P>
        It exits <C>0</C> when clean and <C>1</C> on any finding.
      </P>
      <Callout kind="note" title="npx, or an npm script">
        <C>@cairnkit/cli</C> installs as a local dev dependency, so bare <C>cairn</C> is not on your
        shell PATH — use <C>npx</C>. Inside an npm script it is on PATH, so{" "}
        <C>"lint": "cairnkit check"</C> works without <C>npx</C>.
      </Callout>

      <H2 id="output">Reading the output</H2>
      <Code>{`✗ cairnkit check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - questions.save  (breaks "create-questions")  src/walkthrough/flows.ts:35
      Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.`}</Code>
      <P>Four things: which anchor, which tour it breaks, a clickable location, and what to do.</P>
      <Callout kind="note" title="Why it points at the step, not the element">
        The element was deleted, so it has no location. The step is what needs a decision, and it is
        the file you have to open either way.
      </Callout>

      <H2 id="rules">The rules</H2>
      <PropsTable
        rows={[
          {
            name: "anchors-applied",
            type: "error",
            description:
              "An anchor is registered and referenced by a flow, but never applied to an element.",
          },
          {
            name: "anchors-registered",
            type: "error",
            description:
              "A data-cairn attribute whose value is not in the registry — usually a typo or a leftover.",
          },
          {
            name: "route-conflicts",
            type: "error",
            description:
              "A route in both pauseRoutes and handoffRoutes, or a flow handing off to itself. Overlap is judged with the engine's own matcher, so pausing /projects/:slug while handing off /projects/acme is caught too.",
          },
        ]}
      />

      <H2 id="status">Seeing what is there</H2>
      <P>
        <C>check</C> answers &ldquo;is anything wrong&rdquo;. <C>status</C> answers &ldquo;what is
        there&rdquo;, which is the question you have first in a project you did not write: every
        anchor, whether an element carries it, where it was declared, and which flows point at it.
      </P>
      <Code>{`npx cairnkit status`}</Code>
      <Code>{`cairnkit status · 21 anchors, 4 flow(s)

  ✓ compose.prompt          write-question    src/walkthrough/anchors.ts:8
  ✓ invite.send             invite-candidate  src/walkthrough/anchors.ts:6
  ✓ nav.pipeline                              src/walkthrough/anchors.ts:4
  ! questions.export                               src/walkthrough/anchors.ts:9

  1 registered but not applied, 0 applied but not registered.
  Run cairnkit check for the detail.`}</Code>
      <P>
        A tick means an element carries it. An exclamation means the registry declares it and
        nothing applies it, which is the state <C>check</C> fails on. An anchor with no flow beside
        it is simply not used by a tour yet, which is fine.
      </P>
      <P>
        It always exits <C>0</C>. Describing a project is not a verdict on it, and a command that
        fails for telling you something is a command nobody runs.
      </P>

      <Callout kind="note" title="For tooling and agents">
        <P>
          Both commands take <C>--json</C>. In that mode stdout carries exactly one JSON object and
          every human-facing message goes to stderr, so it pipes straight into a parser:
        </P>
        <Code>{`npx cairnkit status --json
npx cairnkit check --json`}</Code>
        <P>
          The status payload is the anchor graph, which is the thing a coding agent cannot work out
          by searching your files: it needs the registry path resolution and the rule that flow
          files reference anchors rather than apply them. Read it, write the tour with your own
          tools, then run <C>check --json</C> to confirm the result rather than assume it. The
          payload carries a <C>version</C> field so a consumer can tell one shape from another.
        </P>
      </Callout>

      <H2 id="ci">In CI</H2>
      <Code file="package.json">{`"scripts": { "lint": "eslint . && cairnkit check src" }`}</Code>
      <Code file=".github/workflows/ci.yml">{`- run: npx cairnkit check src`}</Code>
      <P>
        Around 0.1s across 700 source files, so it belongs in the fast lane next to your linter
        rather than in a nightly job.
      </P>

      <H2 id="safe">What it does not do</H2>
      <Ul>
        <li>
          <strong>It never executes your code.</strong> It reads files as text, so it is safe to run
          on untrusted branches and needs no build step first.
        </li>
        <li>
          <strong>It cannot see rendering.</strong> An element that exists in source but never
          renders passes — that is the <Link href="/docs/audit">browser audit&rsquo;s</Link> job.
        </li>
        <li>
          <strong>It ignores quoted code.</strong> Comments and string literals are stripped first,
          so a docs page showing a <C>defineAnchors</C> sample will not register phantom anchors.
        </li>
      </Ul>
    </DocPage>
  );
}
