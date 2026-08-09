/**
 * Live numbers for the landing page.
 *
 * Fetched on the server with ISR rather than in the browser: no client
 * JavaScript, no layout shift while it loads, no flash of an empty figure, and
 * crawlers see real numbers. The npm endpoint does send `Access-Control-Allow-
 * Origin: *`, so a client fetch would work — it would just be worse.
 *
 * Nothing here may break a build. A registry outage during deploy must not
 * take the site down, so every failure resolves to `null` and the caller is
 * expected to render nothing.
 */
const PACKAGES = [
  "@cairnkit/core",
  "@cairnkit/react",
  "@cairnkit/ui",
  "@cairnkit/next",
  "@cairnkit/cli",
] as const;

/** Re-fetch hourly. Download figures update roughly daily, so this is ample. */
const REVALIDATE = 3600;

export type Stats = {
  /** Combined last-month downloads across all packages, or null if unknown. */
  downloads: number | null;
  stars: number | null;
};

async function json<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function downloads(): Promise<number | null> {
  // The bulk endpoint explicitly rejects scoped packages, so this is one
  // request per package. Five is cheap once an hour.
  const results = await Promise.all(
    PACKAGES.map((name) =>
      json<{ downloads?: number }>(
        `https://api.npmjs.org/downloads/point/last-month/${name}`,
      ),
    ),
  );

  // If every request failed we know nothing; a partial failure would understate
  // the total, which is the safe direction to be wrong in.
  if (results.every((entry) => entry === null)) return null;

  return results.reduce((total, entry) => total + (entry?.downloads ?? 0), 0);
}

async function stars(): Promise<number | null> {
  const repo = await json<{ stargazers_count?: number }>(
    "https://api.github.com/repos/cairnkit/cairnkit",
  );
  return repo?.stargazers_count ?? null;
}

export async function getStats(): Promise<Stats> {
  const [downloadCount, starCount] = await Promise.all([downloads(), stars()]);
  return { downloads: downloadCount, stars: starCount };
}

/**
 * Below these, a figure says "nobody uses this" louder than it says anything
 * else, so it is not shown at all. Raise them rather than lower them.
 *
 * The download floor is deliberately high. Every publish attracts a few
 * hundred downloads a week from registry mirrors and security scanners before
 * a single human installs anything — this package saw ~200/week within two
 * days of its first release, with one GitHub star and no announcement. A
 * lower floor would light the counter up on that noise and call it adoption.
 */
export const FLOOR = { downloads: 2000, stars: 25 } as const;

export function format(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}
