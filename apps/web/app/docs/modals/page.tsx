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
        { id: "how", label: "What cairnkit does" },
        { id: "usage", label: "Nothing to configure" },
        { id: "closing", label: "Closing it again" },
        { id: "opening", label: "Opening the modal mid-tour" },
      ]}
    >
      <H2 id="why">Why modals are hard</H2>
      <P>
        A step can point at a control inside a dialog, a popover, or a command palette. All of them
        render in their own portal, and each brings a problem:
      </P>
      <Ul>
        <li>
          <strong>Stacking.</strong> A dialog at a high z-index paints over a scrim beneath it.
        </li>
        <li>
          <strong>
            <C>inert</C> and <C>aria-hidden</C>.
          </strong>{" "}
          Dialog libraries mark everything outside the dialog as inert, which would make the
          tour&rsquo;s own buttons unclickable.
        </li>
        <li>
          <strong>Focus traps.</strong> A trap inside the dialog cannot reach a sibling portal, so
          Tab never lands on Next.
        </li>
      </Ul>
      <P>This is where most tour libraries break, and it is not a small edge case.</P>

      <H2 id="how">What cairnkit does</H2>
      <P>
        When the target lives inside a dialog, the overlay portals <strong>into that dialog</strong>{" "}
        rather than onto <C>document.body</C>. It then inherits the dialog&rsquo;s stacking context,
        its interactivity, and its focus scope — all three problems solved by placement.
      </P>
      <Callout kind="note" title="Belt and braces">
        Some libraries mark siblings inert <em>after</em> mount. cairnkit watches its own container
        and strips <C>inert</C> or <C>aria-hidden</C> if something applies them, so the overlay
        cannot be disabled out from under itself.
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
      <H2 id="closing">Closing it again</H2>
      <P>
        The step after a modal step is usually <em>behind</em> the modal. Press Next and the
        spotlight lands on something the user cannot reach — the tour looks broken while being
        technically correct.
      </P>
      <P>
        Steps are data in a flow file, so <C>onExit</C> cannot close over the state that opens the
        dialog — that state lives several components away. The component that owns it publishes a
        named action instead:
      </P>
      <Code>{`import { useTourAction } from "@cairnkit/react";

function InviteSettings() {
  const [open, setOpen] = useState(false);

  // Published while this component is mounted, withdrawn when it unmounts.
  useTourAction("settings:close", () => setOpen(false));

  return <Dialog open={open} onOpenChange={setOpen}>…</Dialog>;
}`}</Code>
      <P>and the step calls it by name:</P>
      <Code>{`{
  anchor: anchors.settings.difficulty,
  title: "Inside a modal",
  body: "Set the difficulty, then continue.",
  onExit: (direction, ctx) => ctx.run("settings:close"),
}`}</Code>
      <P>
        <C>onExit</C> is awaited, so if your close is animated, return a promise that settles when
        it finishes. The next step measures its target the moment this resolves, and a rect read
        mid-transition is the wrong rect.
      </P>
      <Code>{`useTourAction("settings:close", async () => {
  setOpen(false);
  await new Promise((r) => setTimeout(r, 300)); // match your close duration
});`}</Code>
      <P>
        The <C>direction</C> argument is <C>"forward"</C> or <C>"back"</C>. Usually you want to
        close either way — the control that opened the dialog is behind it too — but it is there
        when the two differ. <C>onEnter(ctx)</C> is the mirror image, for putting the app into the
        state a step describes.
      </P>
      <Callout kind="note" title="Name them like anchors">
        Action names narrow to your own literals if you register them, so a typo fails to compile
        rather than warning at runtime:
        <Code>{`declare module "@cairnkit/core" {
  interface CairnRegister {
    actions: "settings:close" | "filters:close";
  }
}`}</Code>
      </Callout>
      <Callout kind="note" title="Cleanup, not driving">
        This looks like it contradicts the rule below, so the line is worth naming: closing a modal
        the user already opened is <em>cleanup</em>. Opening it for them, or clicking the button a
        step is teaching, is <em>driving</em>. The first keeps the tour usable; the second means
        they learn nothing.
      </Callout>
      <Callout kind="note" title="Everything here is forgiving">
        A hook that throws is logged and the tour moves on. An action that was never published warns
        and the tour moves on. Neither should strand someone mid-flow, so neither throws.
      </Callout>

      <Callout kind="warn" title="Do not drive it yourself">
        It is tempting to open the dialog programmatically from the tour. Don&rsquo;t — the point is
        that the user performs the real action. A tour that clicks for you teaches nothing.
      </Callout>
    </DocPage>
  );
}
