import type { MetadataRoute } from "next";
import { FLAT, href } from "./docs/nav";
import { site } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...FLAT.map((page) => ({
      url: `${site.url}${href(page.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
