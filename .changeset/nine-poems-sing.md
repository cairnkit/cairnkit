---
"@cairnkit/cli": minor
---

Add `cairn status`, `--json` on both commands, and fix flows in one file being merged into one.

## `--json`

`check` and the new `status` command both take `--json`. In that mode stdout
carries exactly one JSON object and every human-facing message goes to stderr,
so the output can be piped straight into a parser.

```
npx cairnkit status --json
npx cairnkit check --json
```

The payload carries a `version` field, because it is a contract the moment
anything consumes it and a consumer needs to tell an old shape from a new one
without guessing from which keys happen to be present.

## `cairn status`

Answers "what is there", where `check` answers "is anything wrong": every
anchor, whether an element carries it, whether it got there through the typed
spread or a bare `data-cairn` attribute, where it was declared, and which flows
point at it. Always exits 0, because describing a project is not a verdict on
it.

This exists mainly for tooling. An agent asked to add a tour needs the current
anchor graph before it can write a sensible one, and that graph is not
derivable by grepping: it needs the registry path resolution and the rule that
flow files reference anchors rather than apply them. CI annotations and editor
integrations want the same shape, so it lives in the CLI rather than behind a
separate integration.

## Flows in one file were merged into one

Found while building the above. The scanner parsed flows per *file*: it took the
first `id:` it found and attributed every anchor, pause route and handoff in
that file to it. A file holding four `defineFlow` calls reported one flow owning
all of them.

The visible symptom was `check` naming the wrong flow. Given two flows in one
file, an anchor used only by the second was reported as breaking the first:

```
- b.two  (breaks "first-flow")     ← before, wrong
- b.two  (breaks "second-flow")    ← after
```

Route config leaked the same way, so one flow's `pauseRoutes` were attributed to
another and `route-conflicts` was reasoning about the wrong pairs.

The scanner now cuts the file into one segment per `defineFlow(` and parses each
on its own. Segments are found in the stripped copy so a call quoted inside a
docs snippet does not start a phantom flow, and step offsets are translated back
to file coordinates so findings still point at the step rather than the top of
the file.

## Docs realigned

Every doc, README and page that mentions the CLI now says `cairnkit`, and the
sample failure output matches what the tool actually prints.

Seven places showed `✗ cairn check failed`. The tool has always printed
`✗ cairnkit check failed`, deliberately, because `cairnkit` is the only name
that also works as `npx cairnkit` from a directory with nothing installed.

That distinction is not cosmetic. `cairn` is a real bin alias and works once the
package is installed, but `npx cairn` fetches an unrelated package of that name
from the registry and runs it. One canonical spelling everywhere removes the
chance of a reader copying the form that only works by accident.
