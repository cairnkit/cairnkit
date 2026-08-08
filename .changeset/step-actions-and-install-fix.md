---
"@cairnkit/core": minor
"@cairnkit/react": minor
"@cairnkit/ui": minor
"@cairnkit/next": minor
"@cairnkit/cli": minor
---

Add `useTourAction`, and fix an install that never worked under pnpm.

Both found by integrating the SDK into a real application.

**Step hooks can now reach component state.** `onEnter` and `onExit` shipped in
0.3.0 with a worked example that closed a modal by calling `closeSettings()`
directly. That only compiles if the flow is declared where the setter is in
scope — which is never, for anyone following the recommended layout, because
flows are module-level data. The hooks were unusable for the exact case they
were added for.

Components now publish named actions, and steps call them:

```tsx
useTourAction("settings:close", () => setOpen(false));
```
```ts
onExit: (direction, ctx) => ctx.run("settings:close")
```

Both hooks receive a `StepContext` as their last argument, so existing
callbacks are unaffected. Action names narrow through `CairnRegister.actions`
like anchors and events do. The registry is per-provider rather than
module-level: a module-level map would be shared across requests during server
rendering and collide between two providers on one page.

**`@cairnkit/core` is now in the documented install command.** It was missing
everywhere. npm hoists it as a transitive dependency so nobody noticed, but
pnpm does not, and `declare module "@cairnkit/core"` — the typed-anchor
registry, the headline feature — fails to compile without it. `@cairnkit/react`
additionally re-exports `defineFlow`, `defineAnchors` and `anchor` so authoring
a flow needs one import instead of two.

**Sizes are measured, not remembered.** `pnpm size` prints gzipped sizes and
`pnpm size:check` fails CI when the landing page disagrees. Correcting the
hand-written numbers: core 2.7 kb, react 3.1 kb, ui 6.7 kb, headless 6.1 kb.
"Everything" was overstated at 18.8 kb and actually costs 16.6 kb.
