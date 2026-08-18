import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";
import { PropsTable } from "@/components/docs/props-table";

export const metadata = { title: "Theming" };

export default function Page() {
  return (
    <DocPage
      slug="theming"
      toc={[
        { id: "quick", label: "The one-line version" },
        { id: "tokens", label: "Every token" },
        { id: "darkmode", label: "Light and dark" },
        { id: "launcher", label: "Launcher placement" },
        { id: "labels", label: "Button labels" },
      ]}
    >
      <H2 id="quick">The one-line version</H2>
      <P>Point the accent at your brand colour. Everything else follows.</P>
      <Code file="globals.css">{`:root {
  --cairn-accent: #f75c03;
  --cairn-accent-rgb: 247 92 3;   /* same colour, space-separated, for alpha */
}`}</Code>
      <Callout kind="warn" title="Set both">
        The <C>-rgb</C> triplet is used for translucent rings and glows. Set the hex without it and
        the glow keeps the default colour — a subtle mismatch that is easy to miss.
      </Callout>

      <H2 id="tokens">Every token</H2>
      <PropsTable
        rows={[
          { name: "--cairn-accent", type: "color", default: "#4f46e5", description: "Ring, progress, primary button." },
          { name: "--cairn-accent-rgb", type: "r g b", default: "79 70 229", description: "Same colour for alpha compositing." },
          { name: "--cairn-accent-contrast", type: "color", default: "#ffffff", description: "Text on the accent." },
          { name: "--cairn-surface", type: "color", default: "#ffffff", description: "Card background." },
          { name: "--cairn-surface-border", type: "color", description: "Card and arrow border." },
          { name: "--cairn-text", type: "color", description: "Title text." },
          { name: "--cairn-text-muted", type: "color", description: "Body and secondary text." },
          { name: "--cairn-scrim", type: "color", description: "The dimmed backdrop." },
          { name: "--cairn-rail", type: "color", description: "Unfilled progress segments." },
          { name: "--cairn-radius", type: "length", default: "14px", description: "Card corner radius." },
          { name: "--cairn-shadow", type: "shadow", description: "Card elevation." },
          { name: "--cairn-font", type: "font", default: "inherit", description: "Inherits your app's typeface by default." },
          { name: "--cairn-duration", type: "time", default: "200ms", description: "Motion duration." },
          { name: "--cairn-ease", type: "easing", description: "Motion curve." },
          { name: "--cairn-z", type: "number", default: "2147483000", description: "Overlay stacking order." },
          { name: "--cairn-launcher-inset", type: "length", default: "24px", description: "Distance from the viewport edge." },
        ]}
      />

      <H2 id="darkmode">Light and dark</H2>
      <P>
        Both are defined out of the box. <C>prefers-color-scheme</C> is the default signal, and{" "}
        <C>data-cairn-theme</C> lets your own toggle win in both directions.
      </P>
      <Code>{`<html data-cairn-theme="dark">   <!-- force dark -->
<html data-cairn-theme="light">  <!-- force light -->
<html>                           <!-- follow the OS -->`}</Code>
      <Callout kind="note" title="Typography is not themed">
        <C>--cairn-font</C> is <C>inherit</C> on purpose. An overlay rendering inside your product
        should not impose a typeface on it.
      </Callout>

      <H2 id="launcher">Launcher placement</H2>
      <P>
        The bottom-right corner is contested — support chat widgets live there. Seven placements,
        plus a custom icon.
      </P>
      <Code>{`<TourLauncher flowId="upgrade" position="bottom-left" />
<TourLauncher flowId="upgrade" position="inline" icon={<MyIcon />} />`}</Code>
      <P>
        <C>bottom-right</C> (default), <C>bottom-left</C>, <C>bottom-center</C>, <C>top-right</C>,{" "}
        <C>top-left</C>, <C>top-center</C>, <C>inline</C>. Raise{" "}
        <C>--cairn-launcher-inset</C> to clear a chat bubble.
      </P>

      <H2 id="labels">Button labels</H2>
      <Code>{`<CairnOverlay
  labels={{
    next: "Continue",
    back: "Back",
    skip: "Not now",
    close: "Close",
    done: "Finish",
    counter: (current, total) => \`\${current} / \${total}\`,
  }}
/>`}</Code>
    </DocPage>
  );
}
