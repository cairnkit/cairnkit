# @cairnkit/next

[![npm](https://img.shields.io/npm/v/@cairnkit%2Fnext?label=npm&color=4f46e5)](https://www.npmjs.com/package/@cairnkit/next) [![license](https://img.shields.io/npm/l/@cairnkit%2Fnext?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![min+gzip](https://img.shields.io/badge/min%2Bgzip-0.2%20kb-4f46e5)

![A tour crossing a route boundary and resuming on the next page](https://raw.githubusercontent.com/cairnkit/cairnkit/main/brand/readme/tour.gif)

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

| Export                    | Use                                                     |
| ------------------------- | ------------------------------------------------------- |
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
