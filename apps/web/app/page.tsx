import Link from "next/link";
import { anchor } from "@cairnkit/core";
import { Install } from "@/components/install";
import { Mark } from "@/components/mark";
import {
  IconArrow, IconExit, IconFlow, IconForward, IconLayers, IconPause,
  IconRegistry, IconShield, IconSwitch, IconTarget,
} from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { StartTour } from "@/components/start-tour";
import { ThemeToggle } from "@/components/theme-toggle";
import { anchors } from "@/walkthrough/anchors";
import { site } from "./site";

const STEPS = [
  {
    icon: <IconRegistry />,
    file: "walkthrough/anchors.ts",
    title: "Declare your anchors",
    body: "One registry. Rename a key and every flow that used it stops compiling.",
    code: `export const anchors = defineAnchors({
  questions: { save: "questions.save" },
});`,
  },
  {
    icon: <IconTarget />,
    file: "QuestionsPage.tsx",
    title: "Mark the elements",
    body: "A single spread. Your components import nothing else from Cairn.",
    code: `<button {...anchor(anchors.questions.save)}>
  Save
</button>`,
  },
  {
    icon: <IconFlow />,
    file: "walkthrough/flows.ts",
    title: "Write the flow",
    body: "Steps are data, not components. Reordering is an array edit.",
    code: `defineFlow({
  id: "create-questions",
  version: 1,
  entryRoute: "/questions",
  steps: [{ anchor: anchors.questions.save,
            title: "Save it",
            advanceOn: { type: "click" } }],
});`,
  },
  {
    icon: <IconShield />,
    file: "package.json",
    title: "Wire the check into CI",
    body: "Now a deleted button fails the build instead of a customer's onboarding.",
    code: `"scripts": {
  "lint": "eslint . && cairn check"
}`,
  },
];

const OFFPATH = [
  {
    icon: <IconForward />,
    did: "Clicked the button before the guide got there",
    does: "Catches up, forward only",
    field: "resumeAt",
  },
  {
    icon: <IconSwitch />,
    did: "Took a different route to the same goal",
    does: "Hands over to the guide that covers it",
    field: "handoffRoutes",
  },
  {
    icon: <IconPause />,
    did: "Wandered somewhere no guide covers",
    does: "Sleeps and keeps their place",
    field: "pauseRoutes",
  },
  {
    icon: <IconLayers />,
    did: "Opened a modal you did not plan for",
    does: "Portals into the dialog, survives focus traps",
    field: "automatic",
  },
  {
    icon: <IconExit />,
    did: "Left a modal with the next target behind it",
    does: "Runs your onExit, waits for the close, then measures",
    field: "onExit",
  },
] as const;

const COMPARISON = [
  ["Targets elements by", "CSS selector", "CSS selector", "Visual picker", "Typed anchor"],
  ["You rename a class", "Breaks silently", "Breaks silently", "Breaks silently", "Won't compile"],
  ["You delete the element", "Breaks silently", "Breaks silently", "Breaks silently", "Fails CI"],
  ["Element stops rendering", "Breaks silently", "Breaks silently", "Breaks silently", "Fails the audit"],
  ["Step inside a modal", "Often breaks", "Often breaks", "Works", "Works"],
];

/** kb gzipped, measured from dist. `bar` is the share of the widest row. */
const PACKAGES = [
  { name: "@cairnkit/core", kb: "2.7 kb", bar: 40, note: "Engine. Zero dependencies.", optional: false },
  { name: "@cairnkit/react", kb: "3.1 kb", bar: 46, note: "Headless hooks and provider.", optional: false },
  { name: "@cairnkit/next", kb: "0.3 kb", bar: 4, note: "Router adapters.", optional: true },
  { name: "@cairnkit/ui", kb: "6.7 kb", bar: 100, note: "Prebuilt overlay, JS + CSS.", optional: true },
] as const;

const TOTALS = [
  { label: "Headless", kb: "6.1 kb", bar: 37, note: "core + react + next. Bring your own overlay." },
  { label: "Everything", kb: "16.6 kb", bar: 100, note: "Adds the overlay and @floating-ui/dom." },
] as const;

export default function Home() {
  return (
    <>
      <nav className="nav">
        <div className="wrap nav__in">
          <a className="nav__brand" href="/">
            <Mark /> {site.name}
          </a>
          <div className="nav__links">
            <a className="hide-sm" href="#how">How it works</a>
            <a className="hide-sm" href="#compare">Comparison</a>
            <Link href="/docs">Docs</Link>
            <a href={site.repo}>GitHub</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <header className="wrap hero">
        <h1>Product tours that fail your build, not your users.</h1>
        <p>
          Every other tour tool targets a CSS selector, so a rename breaks it silently and a
          customer finds out first. Cairn puts tours in your repo as typed data and fails CI the
          moment one points at UI that no longer exists.
        </p>

        {/* Install and the CTAs are different actions — copying a command is
            not choosing a path — so they get their own rows. */}
        <div {...anchor(anchors.site.install)} className="hero__install demo-target">
          <Install command="npm i @cairnkit/core @cairnkit/react @cairnkit/ui" />
        </div>

        <div className="hero__cta">
          <StartTour className="btn btn--primary" />
          <Link className="btn btn--ghost" href="/docs">
            Read the docs
          </Link>
        </div>
      </header>

      {/* Four numbers a reader can verify, directly under the hero. Concrete
          claims land harder than adjectives, and it gives the eye a beat
          before the terminal block. */}
      <section className="proof">
        <div className="wrap proof__in">
          {[
            ["6.1 kb", "headless, gzipped"],
            ["0", "runtime dependencies"],
            ["~0.2s", "CI check, 2k files"],
            ["3", "layers of drift defence"],
          ].map(([value, label]) => (
            <div className="proof__item" key={label}>
              <b>{value}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Support matrix, stated plainly. It was the first thing people asked
          and the site answered it nowhere. */}
      <section className="compat">
        <div className="wrap compat__in">
          <span className="compat__label">Verified against</span>
          <ul className="compat__list">
            {[
              "React 18 & 19",
              "Next.js 14, 15, 16",
              "App & Pages Router",
              "Server-rendered",
              "Vite & any router",
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="failure">
        <div className="wrap">
          <p className="eyebrow">The whole idea</p>
          <h2 className="h">A broken tour should break the build</h2>
          <p className="lede">
            Someone deletes a button. Every other tool keeps pointing at nothing until a user
            reports a spotlight over blank space. This runs in about a second, in CI.
          </p>

          <div {...anchor(anchors.site.failure)} className="terminal demo-target">
            <div className="terminal__bar">
              <span className="terminal__dot" />
              <span className="terminal__dot" />
              <span className="terminal__dot" />
            </div>
            <pre>
              <span className="t-dim">$ </span>cairn check{"\n\n"}
              <span className="t-red">✗ cairn check failed</span>
              {"\n\n"}
              {"  "}
              <span className="t-yellow">•</span> 1 anchor(s) are registered but never applied to an
              element{"  "}
              <span className="t-dim">[anchors-applied]</span>
              {"\n"}
              {'      - questions.save  (breaks "create-questions")'}
              <span className="t-dim">{"  src/walkthrough/flows.ts:35"}</span>
              {"\n"}
              <span className="t-dim">
                {"      Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it."}
              </span>
            </pre>
          </div>
        </div>
      </section>

      <section className="section textured" id="how">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 className="h">Four steps, then it is yours</h2>
          <p className="lede">
            No visual editor, no separate dashboard to keep in sync. Tours live next to the code
            they describe and move with it.
          </p>

          <Reveal>
            <div {...anchor(anchors.site.steps)} className="flow demo-target">
              {STEPS.map((step, index) => (
                <article className="fstep glass" key={step.title}>
                  <div className="fstep__top">
                    <span className="fstep__icon">{step.icon}</span>
                    <h3>{step.title}</h3>
                    <span className="fstep__n">0{index + 1}</span>
                  </div>
                  <p>{step.body}</p>
                  <div className="editor">
                    <div className="editor__bar">
                      <span className="editor__dot" />
                      <span className="editor__dot" />
                      <span className="editor__dot" />
                      <span className="editor__file">{step.file}</span>
                    </div>
                    <pre>{step.code}</pre>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section textured" id="offpath">
        <div className="wrap">
          <p className="eyebrow">Real users</p>
          <h2 className="h">Nobody follows the script</h2>
          <p className="lede">
            They click ahead, wander into a different flow, or open a modal you did not plan for.
            Most tours die at that point. Cairn expects it.
          </p>
          <Reveal>
            <div {...anchor(anchors.site.offpath)} className="scenarios demo-target">
              {OFFPATH.map((row, index) => (
                <article className="scenario glass" key={row.field}>
                  <div className="scenario__icon">{row.icon}</div>
                  <p className="scenario__did">
                    <span className="scenario__label">They did</span>
                    {row.did}
                  </p>
                  <p className="scenario__does">
                    <span className="scenario__label">Cairn does</span>
                    {row.does}
                  </p>
                  <code className="scenario__field">{row.field}</code>
                  <span className="scenario__n">{String(index + 1).padStart(2, "0")}</span>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="compare">
        <div className="wrap">
          <p className="eyebrow">Comparison</p>
          <h2 className="h">What happens when the UI changes</h2>
          <p className="lede">
            Not a speed benchmark — Cairn is not faster than driver.js. This is the axis that
            actually costs you: what each tool does the day someone edits a component.
          </p>

          <div {...anchor(anchors.site.comparison)} className="tablewrap demo-target">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>driver.js</th>
                  <th>Shepherd</th>
                  <th>Pendo</th>
                  <th className="ours">Cairn</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([label, ...cells]) => (
                  <tr key={label}>
                    <td style={{ fontWeight: 560 }}>{label}</td>
                    {cells.map((cell, index) => {
                      const isOurs = index === cells.length - 1;
                      const good = isOurs || cell === "Works";
                      return (
                        <td
                          key={index}
                          className={`${good ? "win" : "lose"}${isOurs ? " ours" : ""}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section textured" id="packages">
        <div className="wrap">
          <p className="eyebrow">Packages</p>
          <h2 className="h">Small, and mostly optional</h2>
          <p className="lede">
            Take the engine alone and drive it with your own components, or take the overlay too.
            Headless lands at 6.1 kb — about what driver.js costs, for rather more.
          </p>

          <div {...anchor(anchors.site.packages)} className="pkgs glass demo-target">
            {PACKAGES.map((pkg) => (
              <div className="pkg" key={pkg.name}>
                <div className="pkg__id">
                  <code>{pkg.name}</code>
                  {pkg.optional && <span className="pkg__opt">optional</span>}
                  <span className="pkg__note">{pkg.note}</span>
                </div>
                <div className="pkg__track" aria-hidden>
                  <span className="pkg__fill" style={{ width: `${pkg.bar}%` }} />
                </div>
                <div className="pkg__size">{pkg.kb}</div>
              </div>
            ))}

            {/* The comparison people actually want: what the minimum costs,
                and what everything costs. */}
            {TOTALS.map((total) => (
              <div className="pkg pkg--totals" key={total.label}>
                <div className="pkg__id">
                  <strong>{total.label}</strong>
                  <span className="pkg__note">{total.note}</span>
                </div>
                <div className="pkg__track" aria-hidden>
                  <span
                    className="pkg__fill pkg__fill--muted"
                    style={{ width: `${total.bar}%` }}
                  />
                </div>
                <div className="pkg__size">{total.kb}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>Stop shipping broken tours</h2>
          <p>
            MIT licensed, 2.7 kb of engine, and a CI check that tells you before your users do.
          </p>
          <div className="cta__row">
            <a className="btn btn--primary" href={site.repo}>Get started on GitHub</a>
            <StartTour />
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2 className="h">Put it in your repo</h2>
          <p className="lede" style={{ margin: "0 auto 26px" }}>
            Five minutes to a working tour. An afternoon to a guide that cannot silently break.
          </p>
          <div className="cta__row">
            <Link className="btn btn--primary" href="/docs/install">
              Get started
            </Link>
            <Link className="btn btn--ghost" href="/docs">
              Browse the docs
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer__row">
          <Mark size={17} />
          <span>MIT © {new Date().getFullYear()} {site.name}</span>
          <span>
            Authored by{" "}
            <a className="byline" href={site.authorUrl} target="_blank" rel="noreferrer">
              {site.author}
            </a>
          </span>
          <a href={site.repo}>GitHub</a>
          <a href={site.npm}>npm</a>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </footer>
    </>
  );
}
