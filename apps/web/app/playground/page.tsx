import type { Metadata } from "next";
import Link from "next/link";
import { LauncherLab } from "@/components/playground/launcher-lab";
import { PlaygroundRoot } from "@/components/playground/playground-root";
import { PlaygroundStage } from "@/components/playground/playground";
import { SetupGuide } from "@/components/playground/setup-guide";
import { Snippet } from "@/components/playground/snippet";
import { Mark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "../site";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Run a real Cairn tour against a real UI, change the step options, and copy the flow that produced it. Includes end-to-end React and Next.js setups.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return (
    <>
      <nav className="nav">
        <div className="wrap nav__in">
          <Link className="nav__brand" href="/">
            <Mark /> {site.name}
          </Link>
          <div className="nav__links">
            <Link href="/playground">Playground</Link>
            <Link href="/docs">Docs</Link>
            <a href={site.repo}>GitHub</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <header className="wrap pg__head">
        <span className="pg__eyebrow">Interactive</span>
        <h1>Playground</h1>
        <p>
          A real tour, running against a real UI, driven by the same flow object you would write in
          your own repo. Change an option, run it again, then copy the result.
        </p>
      </header>

      <PlaygroundRoot>
        <section className="wrap">
          <PlaygroundStage />
        </section>

        <section className="wrap pg__section">
          <h2>The launcher</h2>
          <p className="pg__lede">
            How a user starts a tour themselves. Pick a corner and an icon — the launcher below is
            real and fixed to your viewport, so you are looking at the actual component, not a
            picture of it.
          </p>
          <LauncherLab />
        </section>
      </PlaygroundRoot>

      <section className="wrap pg__section">
        <h2>Set it up, end to end</h2>
        <p className="pg__lede">
          Every file you end up with, for both frameworks. These are trimmed from the examples in
          the repository, which CI typechecks, builds and runs a browser audit against — so they
          cannot quietly drift from code that works.
        </p>
        <SetupGuide />
      </section>

      <section className="wrap pg__prose">
        <h2>What makes it work</h2>
        <p>
          Four pieces, and only the first two are things you write. The demo above is wired exactly
          like this — there is no playground-only code path.
        </p>

        <ol className="pg__steps">
          <li>
            <b>Declare the anchors.</b> One object, referenced by name everywhere else. This is the
            file that makes a renamed element a compile error rather than a support ticket.
            <Snippet
              file="walkthrough/anchors.ts"
              max={140}
              code={`export const anchors = defineAnchors({
  demo: { nav: "demo.nav", create: "demo.create", save: "demo.save" },
});`}
            />
          </li>
          <li>
            <b>Apply them.</b> Spread onto the real element. Nothing is queried by class or id, so
            restyling cannot break a tour.
            <Snippet
              file="app/projects.tsx"
              max={90}
              code={`<button {...anchor(anchors.demo.create)}>New project</button>`}
            />
          </li>
          <li>
            <b>Write the flow.</b> Plain data — the panel at the top of this page prints exactly
            this as you change the controls.
          </li>
          <li>
            <b>Mount the provider and the overlay.</b> Once, near the root.
            <Snippet
              file="app/providers.tsx"
              max={140}
              code={`<CairnProvider flows={flows} router={useAppRouterAdapter()}>
  {children}
  <CairnOverlay />
</CairnProvider>`}
            />
          </li>
        </ol>

        <h2>Things that will catch you out</h2>
        <ul className="pg__cautions">
          <li>
            <b>An anchor must be visible to be found.</b> Resolution skips hidden and zero-size
            elements, so a step pointing at something behind a collapsed accordion waits rather than
            resolving. Open it first, or mark the step <code>optional</code>.
          </li>
          <li>
            <b>A step inside a modal needs a way out.</b> Every later step is behind the dialog.
            Close it in <code>onExit</code> — try the third scenario above with that line removed
            and you will watch the spotlight land on covered layout.
          </li>
          <li>
            <b>Do not drive the UI for the user.</b> Closing a dialog they opened is cleanup.
            Clicking the button a step is teaching is not — they learn nothing, and the tour breaks
            the moment the handler changes.
          </li>
          <li>
            <b>Mount the launcher per view, not in the shell.</b> In the shell it follows people
            onto pages its guide says nothing about. Put it on the view the tour describes.
          </li>
          <li>
            <b>Two providers need two storage keys.</b> This page runs its own provider so the
            playground cannot mark the site&apos;s own tour as complete. Pass a key to{" "}
            <code>localStoragePersist(&quot;your-key&quot;)</code> whenever a second provider
            exists.
          </li>
          <li>
            <b>The controls here are not an API.</b> Placement, padding and beacon are ordinary
            fields on a step. There is no runtime config object to learn.
          </li>
        </ul>

        <p className="pg__next">
          Next: <Link href="/docs/install">install it</Link>, or read{" "}
          <Link href="/docs/modals">how modals are handled</Link> and{" "}
          <Link href="/docs/ci">how the build catches drift</Link>.
        </p>
      </section>
    </>
  );
}
