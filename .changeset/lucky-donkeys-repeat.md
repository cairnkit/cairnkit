---
"@cairnkit/cli": patch
"@cairnkit/next": patch
"@cairnkit/ui": patch
"cairnkit": patch
---

Correct the CLI's npm description, fill in missing package metadata, and expand two thin READMEs.

No code changed. All of this ships inside the published tarball, which is why it
needs a release to reach anyone.

**`@cairnkit/cli`'s description said `cairn check`.** The CLI has always printed
`cairnkit check`, and the docs were aligned on that in the previous release, but
the npm description was missed. It is the single most visible surface there is:
the package page, search results, and every registry dashboard. Fixed.

**`cairnkit` and `@cairnkit/ui` had no `bugs` field** and five keywords where the
other five packages carry thirteen. `cairnkit` was also writing its keywords with
spaces, so `"product tour"` never matched a search for `product-tour`. Both now
match the rest.

**Two READMEs were thin enough to be unhelpful.** `@cairnkit/next` documented two
of its three exports, leaving `appRouterAdapter` unmentioned, and said nothing
about why the package exists at all. `cairnkit` did not explain what `init`
produces, or that `npx cairn` fetches an unrelated package of that name while
`npx cairnkit` resolves to this one.

Also corrects the install page, which said `init` prints "the two steps it
deliberately leaves to you". It prints three, and it writes into
`src/walkthrough/` rather than the `app/` paths used by the manual instructions
further down the page.
