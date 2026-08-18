/**
 * Whether a pathname is covered by a route pattern.
 *
 * Every route a flow declares goes through this: `pauseRoutes`, `handoffRoutes`
 * and `resumeAt`. One matcher rather than three, because a syntax somebody
 * learns on one field and finds missing on the next is worse than no syntax.
 *
 * `entryRoute` is deliberately not in that list. It is where a flow *begins*,
 * and the engine navigates to it — a pattern is something you can test a
 * pathname against, not somewhere you can send a browser.
 *
 * Two forms, and a plain string is neither:
 *
 *   "/settings"          exact, and the overwhelming majority
 *   "/projects/:slug"    `:name` matches exactly one non-empty segment
 *   "/docs/*"            `*` matches one or more remaining segments
 *
 * A pattern with no `:` or `*` short-circuits to string equality. That keeps
 * the common case a single comparison rather than two array allocations, and it
 * is what makes this a safe drop-in: every flow written before patterns existed
 * takes the same path it always did.
 *
 * `:name` covers one segment on purpose. `/projects/:slug` must not swallow
 * `/projects/acme/settings`, or a flow pausing on the project screen would also
 * pause on every screen beneath it and go dormant where a different guide was
 * meant to take over. Reaching deeper is what `*` is for, and spelling it is
 * cheap next to debugging a guide that sleeps on the wrong page.
 */

/** Cheap enough to run per comparison, and it decides whether to split at all. */
function isPattern(route: string): boolean {
  return route.includes(":") || route.includes("*");
}

/** Ignores a trailing slash and any empty segments, so "/a/" and "/a" agree. */
function segments(value: string): string[] {
  return value.split("/").filter(Boolean);
}

export function matchRoute(route: string, pathname: string): boolean {
  if (!isPattern(route)) return route === pathname;

  const pattern = segments(route);
  const actual = segments(pathname);

  for (let i = 0; i < pattern.length; i += 1) {
    const part = pattern[i]!;

    /*
     * `*` consumes the rest, so it is the last thing that can match and it
     * requires at least one segment. `/docs/*` describing `/docs` alone would
     * make the wildcard mean "or nothing", and a flow pausing on `/docs/*`
     * would then also pause on the index it was launched from.
     */
    if (part === "*") return actual.length > i;

    const segment = actual[i];
    if (segment === undefined) return false;
    if (part.startsWith(":")) continue;
    if (part !== segment) return false;
  }

  // Every pattern segment matched, so this is only a hit if the pathname ran
  // out at the same time. Otherwise `/projects/:slug` claims `/projects/a/b`.
  return actual.length === pattern.length;
}
