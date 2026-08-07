import { anchor } from "@cairnkit/core";
import { Install } from "@/components/install";
import { Mark } from "@/components/mark";
import { StartTour } from "@/components/start-tour";
import { anchors } from "@/walkthrough/anchors";
import { site } from "./site";

const STEPS = [
  {
    title: "Declare your anchors",
    body: "One registry. Rename a key and every flow that used it stops compiling.",
    code: `export const anchors = defineAnchors({
  questions: { save: "questions.save" },
});`,
  },
  {
    title: "Mark the elements",
    body: "A single spread. Your components import nothing else from Cairn.",
    code: `<button {...anchor(anchors.questions.save)}>
  Save
</button>`,
  },
  {
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
    title: "Wire the check into CI",
    body: "Now a deleted button fails the build instead of a customer's onboarding.",
    code: `"scripts": {
  "lint": "eslint . && cairn check"
}`,
  },
];

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
            <a href="#how">How it works</a>
            <a href="#compare">Comparison</a>
            <a href={site.repo}>GitHub</a>
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
              {"      - questions.save  "}
              <span className="t-dim">(used by create-questions)</span>
              {"\n"}
              <span className="t-dim">
                {"      Spread {...anchor(...)} on the element, or remove the step pointing at it."}
              </span>
            </pre>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 className="h">Four steps, then it is yours</h2>
          <p className="lede">
            No visual editor, no separate dashboard to keep in sync. Tours live next to the code
            they describe and move with it.
          </p>

          <div {...anchor(anchors.site.steps)} className="steps demo-target">
            {STEPS.map((step, index) => (
              <article className="step" key={step.title}>
                <span className="step__n">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <pre className="code">{step.code}</pre>
              </article>
            ))}
          </div>
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

      <footer className="footer">
        <div className="wrap footer__row">
          <Mark size={17} />
          <span>MIT © {new Date().getFullYear()} {site.name}</span>
          <span>Built by {site.author}</span>
          <a href={site.repo}>GitHub</a>
          <a href={site.npm}>npm</a>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </footer>
    </>
  );
}
