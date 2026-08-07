import type { MetadataRoute } from "next";
import { site } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
