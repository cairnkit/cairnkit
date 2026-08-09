---
"@cairnkit/core": patch
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
"@cairnkit/cli": patch
---

Make `cairn init` output readable, and stop it colouring log files.

The instructions were a flat wall of indented text with no separation between
what to read and what to type. Steps are now numbered, each names the file it
applies to, and every command or snippet sits in its own gutter so the eye can
find it. A left bar rather than a drawn box — boxes have to guess the terminal
width and wrap badly when they guess wrong.

Colour is now emitted only when stdout is a TTY, and `NO_COLOR` and
`TERM=dumb` are honoured. Redirecting the output previously wrote ten escape
sequences into the file, which is exactly where they are least wanted.

The steps themselves are structured data on the plan now rather than
pre-indented strings, so presentation lives in the command and the planner
stays about content.
