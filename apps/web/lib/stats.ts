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
/**
 * One package, not the sum of all five.
 *
 * Installing the SDK pulls core plus react plus ui, and often next and cli
 * too, so adding the five together counts a single adopter up to five times.
 * `core` is the honest proxy: every other package depends on it, so any
 * install downloads it exactly once.
 */
const BELLWETHER = "@cairnkit/core";

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
  const result = await json<{ downloads?: number }>(
    `https://api.npmjs.org/downloads/point/last-month/${BELLWETHER}`,
  );
  return result?.downloads ?? null;
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
 * Stars are shown once they mean something; downloads are not shown at all.
 *
 * npm counts every fetch, and a newly published package is fetched constantly
 * by registry mirrors and security scanners. This one went 0 → ~1,050/day the
 * day it was published and stayed flat there, with one GitHub star and no
 * announcement — roughly 31,000 a month before a single human installs
 * anything. No floor separates that from adoption, because the noise is larger
 * than any number worth advertising.
 *
 * Real adoption is lumpy: it spikes when something is posted and settles
 * higher than before. If that shape ever appears, show a figure again — as a
 * sparkline, which makes the shape visible, rather than a total that cannot.
 */
export const FLOOR = { downloads: Infinity, stars: 25 } as const;

export function format(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}
