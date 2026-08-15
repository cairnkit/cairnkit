import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";

export const metadata = { title: "Browser audit" };

export default function Page() {
  return (
    <DocPage
      slug="audit"
      toc={[
        { id: "why", label: "What it catches" },
        { id: "setup", label: "Setup" },
        { id: "ci", label: "In CI" },
        { id: "options", label: "Options" },
      ]}
    >
      <H2 id="why">What it catches</H2>
      <P>
        The third layer. TypeScript catches a typo. <Link href="/docs/ci">cairnkit check</Link> catches
        an element deleted from source. Neither can see whether an element actually{" "}
        <em>renders</em> — behind a feature flag, in an empty state, or inside a conditional that no
        longer fires. That needs a browser.
      </P>
      <P>
        The audit drives each tour the way a user would and reports any step whose anchor produced
        no spotlight.
      </P>

      <H2 id="setup">Setup</H2>
      <Code file="tests/walkthrough.spec.ts">{`import { test } from "@playwright/test";
import { auditFlows } from "@cairnkit/cli";
import { inviteFlow, questionsFlow } from "../src/walkthrough/flows";

const BASE = "http://localhost:4200";

test("every step of every flow spotlights something", async ({ page }) => {
  await auditFlows(page, [
    { url: BASE, flow: inviteFlow },
    { url: \`\${BASE}/questions\`, flow: questionsFlow },
  ]);
});`}</Code>
      <P>
        It uses your <C>?tour=</C> deep link to start each flow, presses Next where offered, and
        clicks the real anchored element where the step waits on an action.
      </P>
      <Callout kind="note" title="Structurally typed">
        <C>auditFlows</C> takes a Playwright <C>Page</C> but <C>@cairnkit/cli</C> has no dependency
        on Playwright — it accepts the subset of methods it uses, so nothing is added to your tree.
      </Callout>

      <H2 id="ci">In CI</H2>
      <Code file=".github/workflows/ci.yml">{`- run: npx playwright install --with-deps chromium
- run: npx playwright test

- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/`}</Code>

      <H2 id="options">Options</H2>
      <Ul>
        <li><C>url</C> — the page the flow starts on. <C>?tour=</C> is appended for you.</li>
        <li><C>flow</C> — the flow object, so the auditor knows which element to click.</li>
        <li><C>settleMs</C> — how long each step is given to settle. Default 400.</li>
        <li><C>timeout</C> — per-step wait before a step counts as unreached. Default 8000.</li>
      </Ul>
      <Callout kind="warn" title="It stops at the first unreachable step">
        Everything after an unreachable step is unreachable too. Waiting out the timeout for each
        one turns a clear failure into a test-suite timeout that tells you nothing.
      </Callout>
    </DocPage>
  );
}
