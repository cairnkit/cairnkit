---
"@cairnkit/react": patch
"@cairnkit/ui": patch
"@cairnkit/next": patch
---

Ship `"use client"` in the published bundles of `react`, `ui` and `next`.

Every module in these three packages declares the directive in source, and none of them survived bundling: esbuild concatenates the modules and cannot hoist twenty per-file directives into the one position a bundle has for them. Next therefore read the published file as a server module, and the first server component to import from one threw at module evaluation:

```
createContext only works in Client Components.
```

That made the documented App Router integration fail for anything mounted outside a file with its own `"use client"`, which includes `TourLauncher` on the page it describes, and the workaround was a re-export through a local client boundary.

Fixed as a build step rather than tsup's `banner`, because `banner` only lands for the one package that does not treeshake: `react` and `next` run rollup over esbuild's output, and rollup drops a string literal it did not add itself. A CI check now asserts the directive is present in all six bundles, since this is a property of the published file that no test or typecheck of the source can see.

`@cairnkit/core` is deliberately unchanged. It has no React import, so `anchor()` and `defineFlow()` stay callable from a server component.
