---
"@cairnkit/core": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
"@cairnkit/cli": patch
---

Stop `cairn check` crashing in projects without a `src/` directory.

`src` was the only default and `readdirSync` throws on a directory that is not
there, so any project without one — a Next app created with `--no-src-dir`,
most obviously — got a raw ENOENT stack trace out of `node:fs` instead of an
answer. Worse, `cairn init` had just scaffolded into `walkthrough/`, so the
command failed immediately after the command that set it up.

With no arguments it now looks for `src`, `app`, `pages`, `walkthrough`, `lib`
and `components`, scans every one it finds, and falls back to the working
directory when it recognises none. A path that genuinely does not exist is
reported as a sentence naming it, not a stack trace — which matters for anyone
reading the output, and rather more for a coding agent trying to act on it.
