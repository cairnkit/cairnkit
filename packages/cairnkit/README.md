# cairnkit

A launcher for [`@cairnkit/cli`](https://www.npmjs.com/package/@cairnkit/cli), so
the first command works before anything is installed:

```bash
npx cairnkit init     # scaffold a walkthrough into an existing app
npx cairnkit check    # fail the build when a tour points at UI that is gone
```

That is all this package does. It has no code of its own — it depends on
`@cairnkit/cli` at the same version and hands straight over to it.

Once cairnkit is a dependency of your project, use whichever name you prefer:
`cairnkit`, `cairn`, or `npx @cairnkit/cli`. All three run the same binary.

Docs: **[cairnkit.dev](https://cairnkit.dev)**
