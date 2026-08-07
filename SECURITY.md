# Security

## Reporting a vulnerability

Email **hello@cairnkit.dev** — do not open a public issue. Expect an
acknowledgement within 3 working days and a fix or mitigation plan within 14.

## Threat model

Cairn renders inside a host application, reads its DOM, and can emit analytics.
That gives it three surfaces worth stating plainly.

**Selector injection.** Anchor ids reach `document.querySelector`. They are
normally author-written, but they also arrive from config and from `?tour=`
deep links. Ids are escaped with `CSS.escape` before they reach a selector, so
a crafted id cannot break out of the attribute matcher and target elements the
tour was never pointed at.

**Copy rendering.** Step titles and bodies are rendered as text. Cairn never
uses `dangerouslySetInnerHTML` or `innerHTML`, so a translation catalogue or a
CMS cannot become an XSS vector through a tour.

**Analytics payloads.** Events carry flow ids, step indices and anchor ids
only. Cairn never reads or transmits DOM text, form values, or anything the
user typed. If you add a feedback field, you own what the user puts in it.

**The CLI.** `cairn check` runs in CI, often on untrusted branches. It only
reads text files inside the directory it is given, refuses to follow symlinks
out of that root, and never imports or executes project code.

## Supply chain

- `@cairnkit/core` has **zero runtime dependencies**. The others depend only on
  each other, with React and Next as peers.
- Releases publish with npm provenance from GitHub Actions.
- Lockfile committed; Dependabot enabled; secrets scanning on every commit.

## Content Security Policy

Cairn needs no `unsafe-eval` and no remote origins. Styles ship as a static
stylesheet rather than injected `<style>` tags, so a strict `style-src` works
without a nonce.
