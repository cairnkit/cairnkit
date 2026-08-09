import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "cairn check" };

export default function Page() {
  return (
    <DocPage
      slug="ci"
      toc={[
        { id: "run", label: "Running it" },
        { id: "output", label: "Reading the output" },
        { id: "rules", label: "The rules" },
        { id: "ci", label: "In CI" },
        { id: "safe", label: "What it does not do" },
      ]}
    >
      <H2 id="run">Running it</H2>
      <Code>{`npx cairn check`}</Code>
      <P>
        The path defaults to <C>src</C>. Pass one or more directories if your code lives
        elsewhere or spans several roots — everything is scanned as a single project, so a flow
        in one directory can point at a component in another:
      </P>
      <Code>{`npx cairn check src
npx cairn check src app packages/ui`}</Code>
      <P>
        It exits <C>0</C> when clean and <C>1</C> on any finding.
      </P>
      <Callout kind="note" title="npx, or an npm script">
        <C>@cairnkit/cli</C> installs as a local dev dependency, so bare <C>cairn</C> is not on
        your shell PATH — use <C>npx</C>. Inside an npm script it is on PATH, so{" "}
        <C>"lint": "cairn check"</C> works without <C>npx</C>.
      </Callout>

      <H2 id="output">Reading the output</H2>
      <Code>{`✗ cairn check failed

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
          { name: "anchors-applied", type: "error", description: "An anchor is registered and referenced by a flow, but never applied to an element." },
          { name: "anchors-registered", type: "error", description: "A data-cairn attribute whose value is not in the registry — usually a typo or a leftover." },
          { name: "route-conflicts", type: "error", description: "A route in both pauseRoutes and handoffRoutes, or a flow handing off to itself." },
        ]}
      />

      <H2 id="ci">In CI</H2>
      <Code file="package.json">{`"scripts": { "lint": "eslint . && cairn check src" }`}</Code>
      <Code file=".github/workflows/ci.yml">{`- run: npx cairn check src`}</Code>
      <P>
        Around 0.1s across 700 source files, so it belongs in the fast lane next to your linter rather
        than in a nightly job.
      </P>

      <H2 id="safe">What it does not do</H2>
      <Ul>
        <li>
          <strong>It never executes your code.</strong> It reads files as text, so it is safe to run
          on untrusted branches and needs no build step first.
        </li>
        <li>
          <strong>It cannot see rendering.</strong> An element that exists in source but never
          renders passes — that is the{" "}
          <Link href="/docs/audit">browser audit&rsquo;s</Link> job.
        </li>
        <li>
          <strong>It ignores quoted code.</strong> Comments and string literals are stripped first,
          so a docs page showing a <C>defineAnchors</C> sample will not register phantom anchors.
        </li>
      </Ul>
    </DocPage>
  );
}
