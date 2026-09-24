import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Sections are fragments of one page, not separate indexable URLs.
  return [{ url: `${site.url}/` }];
}
