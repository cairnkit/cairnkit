# @cairnkit/next

Next.js router adapters for [cairnkit](https://cairnkit.dev), so a tour can move
a reader between routes and pick up where it left off.

cairnkit's engine never imports a router. It asks the host how to read the
current path and how to navigate, and this package answers that for Next. If you
are not on Next, you write those two functions yourself and skip this entirely.

```bash
npm i @cairnkit/core @cairnkit/react @cairnkit/next
```

## App Router

```tsx
"use client";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";

export function CairnRuntime({ children }: { children: React.ReactNode }) {
  return (
    <CairnProvider flows={flows} router={useAppRouterAdapter()}>
      {children}
    </CairnProvider>
  );
}
```

The provider has to wrap your app rather than sit beside it, so mount it inside
`<body>` in `app/layout.tsx`.

## Pages Router

```tsx
import { usePagesRouterAdapter } from "@cairnkit/next";

<CairnProvider flows={flows} router={usePagesRouterAdapter()}>
  <Component {...pageProps} />
</CairnProvider>;
```

## API

| Export                    | Use                                                    |
| ------------------------- | ------------------------------------------------------ |
| `useAppRouterAdapter()`   | App Router. **Preferred.**                              |
| `usePagesRouterAdapter()` | Pages Router.                                           |
| `appRouterAdapter()`      | Non-hook form, kept for callers that cannot use a hook. |

Prefer the hook forms. `appRouterAdapter()` calls `useRouter` inside `navigate`
rather than at the top, which works but breaks the rules of hooks, so it exists
for the awkward cases rather than as the default.

## Two things worth knowing

**Search params are not read.** `?tour=` deep linking is opt-in through
`useTourDeepLink`, because `useSearchParams` opts its whole subtree out of
prerendering and that is not a cost to impose on every app that mounts a tour.

**App Router updates `usePathname` after the outgoing route's DOM is gone.** The
engine restarts its missing-anchor timeout on a pathname change for exactly this
reason; without it a slow transition would trip the timeout mid-navigation and
end the tour on a route it was only passing through.

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
