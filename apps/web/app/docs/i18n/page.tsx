import { DocPage } from "@/components/docs/doc-page";
import { C, Callout, H2, P } from "@/components/docs/prose";
import { Code } from "@/components/docs/code";

export const metadata = { title: "Copy and i18n" };

export default function Page() {
  return (
    <DocPage
      slug="i18n"
      toc={[
        { id: "inline", label: "Inline copy" },
        { id: "translate", label: "Your own catalogue" },
        { id: "labels", label: "Overlay labels" },
        { id: "writing", label: "Writing good step copy" },
      ]}
    >
      <H2 id="inline">Inline copy</H2>
      <P>The default. Fine for a single-locale product.</P>
      <Code>{`{ anchor: anchors.q.save, title: "Save it", body: "Nothing is stored until you do." }`}</Code>

      <H2 id="translate">Your own catalogue</H2>
      <P>
        Use <C>titleKey</C> and <C>bodyKey</C> instead, and hand the provider a resolver. Cairn does
        not ship an i18n library and does not care which you use.
      </P>
      <Code>{`{ anchor: anchors.q.save, titleKey: "tour.save.title", bodyKey: "tour.save.body" }`}</Code>
      <Code file="providers.tsx">{`const t = useTranslations();          // next-intl
// const { t } = useTranslation();    // react-i18next

<CairnProvider flows={flows} router={router} translate={(key) => t(key)}>`}</Code>
      <Callout kind="good" title="Terminology follows for free">
        If your catalogue already remaps vocabulary per tenant — candidate becomes student, say —
        tour copy inherits that, because it is resolved through the same function as the rest of
        your product.
      </Callout>

      <H2 id="labels">Overlay labels</H2>
      <P>The buttons are separate from step copy, since they are the same on every step.</P>
      <Code>{`<CairnOverlay
  labels={{
    next: t("common.next"),
    back: t("common.back"),
    skip: t("common.skip"),
    close: t("common.close"),
    done: t("common.done"),
    counter: (current, total) => t("tour.counter", { current, total }),
  }}
/>`}</Code>
      <P>
        <strong>close</strong> labels the X in the corner and is deliberately separate from{" "}
        <strong>skip</strong>. They shared one label until 0.10, which told a screen-reader user
        they were pressing Skip when the control beside it was also Skip. They are different acts
        as well as different buttons — cairnkit reports which one ended the tour.
      </P>

      <H2 id="writing">Writing good step copy</H2>
      <P>
        Titles under six words. Bodies at most two short sentences. Always name the action:
        &ldquo;Click <strong>Create manually</strong>&rdquo; beats &ldquo;you can create a question
        here&rdquo;.
      </P>
      <Callout kind="warn" title="Long popovers are where tours die">
        People skim a tour. If a step needs a paragraph, the underlying UI probably needs the work
        instead.
      </Callout>
    </DocPage>
  );
}
