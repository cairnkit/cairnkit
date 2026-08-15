---
"@cairnkit/cli": patch
---

Report the anchor id when a `data-cairn` attribute is not in the registry, and stop reporting registered ones.

`cairn check` scans a stripped copy of each file, where comments and string
contents are replaced with same-length padding so that a `defineAnchors({...})`
quoted inside a docs snippet cannot register phantom anchors.

A JSX attribute value is a string literal, so the `data-cairn="..."` scan was
reading that padding rather than the id. Two consequences, both on the raw
attribute path only:

- **Every** `data-cairn` attribute was reported as "not in the registry", even
  when it was registered, because the value being looked up was a run of spaces.
- The finding could not name the offending value, so the report read
  `- ␣␣␣␣␣ src/components/help.tsx:2` with a blank where the id should be.

The scan now reads the value from the original source and skips any match whose
offset no longer begins with `data-cairn=` in the stripped copy. That guard is
what preserves the original protection: a comment or template literal is blanked
wholesale, attribute name included, so a documented example still does not count
as a real use, while a genuine attribute keeps its name because only the quoted
value is padded.

Applying anchors the documented way, `{...anchor(anchors.group.key)}`, was never
affected: those are matched as identifiers rather than as strings.
