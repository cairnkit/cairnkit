import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P, Ul } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";

export const metadata = { title: "Modals and portals" };

export default function Page() {
  return (
    <DocPage
      slug="modals"
      toc={[
        { id: "why", label: "Why modals are hard" },
        { id: "how", label: "What Cairn does" },
        { id: "usage", label: "Nothing to configure" },
        { id: "opening", label: "Opening the modal mid-tour" },
      ]}
    >
      <H2 id="why">Why modals are hard</H2>
      <P>
        A step can point at a control inside a dialog, a popover, or a command palette. All of them
        render in their own portal, and each brings a problem:
      </P>
      <Ul>
        <li><strong>Stacking.</strong> A dialog at a high z-index paints over a scrim beneath it.</li>
        <li>
          <strong><C>inert</C> and <C>aria-hidden</C>.</strong> Dialog libraries mark everything
          outside the dialog as inert, which would make the tour&rsquo;s own buttons unclickable.
        </li>
        <li>
          <strong>Focus traps.</strong> A trap inside the dialog cannot reach a sibling portal, so
          Tab never lands on Next.
        </li>
      </Ul>
      <P>This is where most tour libraries break, and it is not a small edge case.</P>

      <H2 id="how">What Cairn does</H2>
      <P>
        When the target lives inside a dialog, the overlay portals <strong>into that dialog</strong>{" "}
        rather than onto <C>document.body</C>. It then inherits the dialog&rsquo;s stacking context,
        its interactivity, and its focus scope — all three problems solved by placement.
      </P>
      <Callout kind="note" title="Belt and braces">
        Some libraries mark siblings inert <em>after</em> mount. Cairn watches its own container and
        strips <C>inert</C> or <C>aria-hidden</C> if something applies them, so the overlay cannot
        be disabled out from under itself.
      </Callout>

      <H2 id="usage">Nothing to configure</H2>
      <P>
        Point a step at an anchor inside your dialog. Detection is automatic — it looks for{" "}
        <C>[role=&quot;dialog&quot;]</C>, <C>[role=&quot;alertdialog&quot;]</C> and{" "}
        <C>dialog[open]</C>, which covers Radix, Headless UI, MUI and native dialogs.
      </P>
      <Code>{`{ anchor: anchors.settings.difficulty, title: "Inside a modal" }`}</Code>

      <H2 id="opening">Opening the modal mid-tour</H2>
      <P>
        Use a <C>click</C> step on the button that opens it. The user opens the dialog themselves,
        and the next step&rsquo;s anchor is waited for until it mounts.
      </P>
      <Code>{`steps: [
  {
    anchor: anchors.page.settingsButton,
    title: "Open settings",
    body: "The next step is inside the dialog.",
    advanceOn: { type: "click" },
  },
  { anchor: anchors.settings.difficulty, title: "Inside a modal" },
]`}</Code>
      <Callout kind="warn" title="Do not drive it yourself">
        It is tempting to open the dialog programmatically from the tour. Don&rsquo;t — the point is
        that the user performs the real action. A tour that clicks for you teaches nothing.
      </Callout>
    </DocPage>
  );
}
