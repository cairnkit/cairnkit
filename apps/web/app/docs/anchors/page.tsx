import { DocPage } from "@/components/docs/doc-page";
import { Callout, C, H2, H3, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";

export const metadata = { title: "Anchors" };

export default function Page() {
  return (
    <DocPage
      slug="anchors"
      toc={[
        { id: "declare", label: "Declaring anchors" },
        { id: "apply", label: "Applying them" },
        { id: "swallow", label: "Components that swallow props" },
        { id: "resolution", label: "How resolution works" },
        { id: "why", label: "Why not CSS selectors" },
      ]}
    >
      <H2 id="declare">Declaring anchors</H2>
      <P>
        Every element a tour can point at lives in one registry. Flows reference the registry, never
        a raw string, so renaming a key breaks the flow file at compile time.
      </P>
      <Code file="walkthrough/anchors.ts">{`import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  questions: {
    tabCreate: "questions.tab-create",
    save: "questions.save",
  },
});`}</Code>

      <H2 id="apply">Applying them</H2>
      <P>
        One spread. Your components import nothing else from Cairn, and stay unaware they are part
        of a tour.
      </P>
      <Code>{`import { anchor } from "@cairnkit/core";

<button {...anchor(anchors.questions.save)}>Save</button>`}</Code>
      <P>
        For config-driven UI such as a sidebar, put the id on the item and let the renderer forward
        it as <C>data-cairn</C>.
      </P>

      <H2 id="swallow">Components that swallow props</H2>
      <P>
        Some third-party components do not forward unknown props. <C>{"<TourAnchor>"}</C> wraps them
        without adding a box to the layout.
      </P>
      <Code>{`import { TourAnchor } from "@cairnkit/react";

<TourAnchor id={anchors.questions.save}>
  <ThirdPartyButton />
</TourAnchor>`}</Code>
      <Callout kind="note" title="How it measures">
        The wrapper uses <C>display: contents</C>, so it has no box of its own. Cairn detects that
        and measures the child instead — otherwise the spotlight would have nothing to draw.
      </Callout>

      <H2 id="resolution">How resolution works</H2>
      <Ul>
        <li>Matches are filtered to <strong>visible</strong> elements first.</li>
        <li>A missing anchor is waited for, via <C>MutationObserver</C>, up to <C>waitForMs</C>.</li>
        <li>If a resolved element later disappears, resolution restarts.</li>
      </Ul>
      <Callout kind="note" title="Why visibility matters">
        Responsive shells legitimately render the same anchor twice — a desktop sidebar stays
        mounted but hidden at mobile widths. A plain <C>querySelector</C> would return the 0×0 one
        and spotlight nothing. This is what lets a single id work across breakpoints.
      </Callout>

      <H2 id="why">Why not CSS selectors</H2>
      <P>
        A selector like <C>.btn-primary:nth-child(2)</C> is a guess about structure that nothing
        enforces. Rename the class, reorder the DOM, and the tour breaks with no signal. A declared
        anchor is a contract: the compiler checks the reference, and CI checks the element still
        exists.
      </P>
    </DocPage>
  );
}
