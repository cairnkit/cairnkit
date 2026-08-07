import { anchor } from "@cairnkit/core";
import { Install } from "@/components/install";
import { Mark } from "@/components/mark";
import {
  IconArrow, IconFlow, IconForward, IconLayers, IconPause,
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
] as const;

const COMPARISON = [
  ["Targets elements by", "CSS selector", "CSS selector", "Visual picker", "Typed anchor"],
  ["You rename a class", "Breaks silently", "Breaks silently", "Breaks silently", "Won't compile"],
  ["You delete the element", "Breaks silently", "Breaks silently", "Breaks silently", "Fails CI"],
  ["Element stops rendering", "Breaks silently", "Breaks silently", "Breaks silently", "Fails the audit"],
  ["Step inside a modal", "Often breaks", "Often breaks", "Works", "Works"],
];

const PACKAGES = [
  ["@cairnkit/core", "2.5 kb", "Zero dependencies"],
  ["@cairnkit/react", "2.6 kb", "Headless hooks"],
  ["@cairnkit/ui", "4.3 kb", "Prebuilt overlay"],
  ["@cairnkit/next", "0.3 kb", "Router adapters"],
];

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

        <div {...anchor(anchors.site.install)} className="hero__cta demo-target">
          <Install command="npm i @cairnkit/react @cairnkit/ui" />
          <StartTour className="btn btn--primary" />
          <a className="btn btn--ghost" href={site.repo}>
            GitHub
          </a>
        </div>
      </header>

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
            Most tours die at that point. These three fields are the answer.
          </p>
          <Reveal>
            <div className="offpath glass">
              {OFFPATH.map((row) => (
                <div className="offrow" key={row.field}>
                  <span className="offrow__did">{row.did}</span>
                  <span className="offrow__arrow">
                    <IconArrow />
                  </span>
                  <span className="offrow__does">
                    <span className="fstep__icon" style={{ width: 28, height: 28, display: "inline-grid", verticalAlign: "-8px", marginRight: 9 }}>
                      {row.icon}
                    </span>
                    <b>{row.does}</b>
                    <span className="offrow__field">{row.field}</span>
                  </span>
                </div>
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

      <section className="section" id="packages">
        <div className="wrap">
          <p className="eyebrow">Packages</p>
          <h2 className="h">Small, and mostly optional</h2>
          <p className="lede">
            The engine is framework-free. React is one binding, not the architecture — a router
            adapter is about ten lines.
          </p>

          <div {...anchor(anchors.site.packages)} className="stats demo-target">
            {PACKAGES.map(([name, size, note]) => (
              <div className="statcard" key={name}>
                <b>{size}</b>
                <span>
                  <code>{name}</code>
                  <br />
                  {note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>Stop shipping broken tours</h2>
          <p>
            MIT licensed, 2.5 kb of engine, and a CI check that tells you before your users do.
          </p>
          <div className="cta__row">
            <a className="btn btn--primary" href={site.repo}>Get started on GitHub</a>
            <StartTour />
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
