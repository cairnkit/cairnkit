import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { Callout, C, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { DOC_NAV, href } from "./nav";

export const metadata = { title: "Introduction" };

export default function Page() {
  return (
    <DocPage
      slug=""
      toc={[
        { id: "problem", label: "The problem" },
        { id: "approach", label: "How cairnkit differs" },
        { id: "layers", label: "Three layers of defence" },
        { id: "next", label: "Where to go next" },
      ]}
    >
      <H2 id="problem">The problem</H2>
      <P>
        Every tour tool breaks the same way. Someone renames a button, the tour keeps pointing at a
        selector that no longer exists, and nobody finds out until a customer sees a spotlight over
        empty space. The industry calls it <strong>onboarding rot</strong>.
      </P>
      <P>
        The usual answers — AI element fingerprinting, self-healing selectors — all try to repair
        the damage <em>after</em> it ships. The best case is that a user never notices.
      </P>

      <H2 id="approach">How cairnkit differs</H2>
      <P>
        Tours are typed data in your repository, anchors are verified in CI, and a broken tour fails
        the build before it reaches anyone.
      </P>
      <Code>{`✗ cairn check failed

  • 1 anchor(s) are registered but never applied to an element  [anchors-applied]
      - questions.save  (breaks "create-questions")  src/walkthrough/flows.ts:35
      Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.`}</Code>
      <Callout kind="note" title="Why this is possible at all">
        Because cairnkit lives in your repo rather than a dashboard. A no-code tool has no build to
        fail — that is a structural difference, not a feature gap.
      </Callout>

      <H2 id="layers">Three layers of defence</H2>
      <Ul>
        <li>
          <strong>TypeScript</strong> — a typo in an anchor, flow id or event name will not compile.
        </li>
        <li>
          <strong>
            <C>cairn check</C>
          </strong>{" "}
          — an element deleted from source fails CI in about a second, naming the tour it breaks and
          the line to open.
        </li>
        <li>
          <strong>Browser audit</strong> — an anchor that exists in source but never renders,
          because of a feature flag or an empty state, fails a Playwright run.
        </li>
      </Ul>
      <P>
        Each catches something the others cannot. Together they mean a tour cannot silently stop
        working.
      </P>

      <H2 id="next">Where to go next</H2>
      <Ul>
        {DOC_NAV.flatMap((s) => s.pages)
          .filter((p) => p.slug)
          .slice(0, 5)
          .map((p) => (
            <li key={p.slug}>
              <Link href={href(p.slug)}>{p.title}</Link> — {p.blurb}
            </li>
          ))}
      </Ul>
    </DocPage>
  );
}
