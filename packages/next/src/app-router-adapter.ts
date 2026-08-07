"use client";

import { usePathname, useRouter } from "next/navigation";
import type { RouterAdapter } from "@cairnkit/react";

/**
 * App Router adapter.
 *
 * `usePathname` updates *after* the outgoing route's DOM is torn down, which is
 * why `useAnchorTarget` restarts its timeout on pathname change. Without that,
 * a slow transition trips the missing-anchor timeout mid-navigation.
 *
 * Note: this does not read search params. `?tour=` deep linking is opt-in via
 * `useTourDeepLink`, which needs its own Suspense boundary because
 * `useSearchParams` opts its subtree out of prerendering.
 */
export function appRouterAdapter(): RouterAdapter {
  return {
    usePathname,
    navigate: (href) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      router.push(href);
    },
  };
}

/** Hook form — preferred, because `navigate` can hold the router properly. */
export function useAppRouterAdapter(): RouterAdapter {
  const router = useRouter();
  return {
    usePathname,
    navigate: (href) => router.push(href),
  };
}
