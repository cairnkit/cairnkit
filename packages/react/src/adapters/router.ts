/**
 * The one seam that keeps Cairn from being a Next.js library.
 *
 * Everything route-aware — `route` advance rules, resumeAt, pauseRoutes,
 * handoffRoutes — goes through this. An adapter for App Router, Pages Router,
 * react-router or TanStack Router is about ten lines each.
 */
export type RouterAdapter = {
  /** Reactive: must re-render its consumer when the path changes. */
  usePathname(): string;
  /** Client-side navigation. */
  navigate(href: string): void;
};

/** Fallback for apps without a router, and for tests. */
export const memoryRouter: RouterAdapter = {
  usePathname: () => (typeof window === "undefined" ? "/" : window.location.pathname),
  navigate: (href) => {
    if (typeof window !== "undefined") window.location.assign(href);
  },
};
