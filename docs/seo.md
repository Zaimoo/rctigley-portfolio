# Search and AI discovery

The canonical origin is `https://reycezartigley.work`, configured in
`lib/site.ts`. Update it there if the domain changes.

- `app/layout.tsx` defines the canonical URL, search description, Open Graph,
  Twitter card, and indexing directives.
- `app/opengraph-image.tsx` generates a 1200 × 630 social preview locally.
- `app/robots.ts` allows all compliant crawlers, including search, AI search,
  and AI training crawlers. It does not block JavaScript or image assets.
- `app/sitemap.ts` lists the homepage. Section anchors are not separate pages;
  no artificial last-modified timestamp is emitted.
- `lib/site.ts` generates Person, WebSite, and ProfilePage JSON-LD from the
  portfolio content. Shared project contributions are not claimed as sole authorship.
- `/llms.txt` provides a plain-text Markdown version generated from
  `lib/content.ts`. This is a supplementary, experimental discovery format,
  not a requirement for indexing or a guarantee of AI citations.
- Portfolio text is present in the initial HTML. Scroll reveals only hide
  below-viewport content after JavaScript initializes; without JavaScript,
  section content remains visible.

## Deployment checks

1. Run `npm run lint` and `npm run build`, then deploy the resulting changes.
2. Confirm `/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and
   `/opengraph-image` return HTTP 200 on the production domain.
3. Redirect any alternate domains to the canonical HTTPS domain at the host.
4. Ensure hosting/CDN bot protection permits desired crawlers. Application
   robots rules cannot override a firewall or a hosting authentication gate.
5. Verify domain ownership in Google Search Console and Bing Webmaster Tools,
   submit `https://reycezartigley.work/sitemap.xml`, and inspect the homepage.
6. Validate the live structured data with https://validator.schema.org/ and
   check social previews after deployment.

Search engines decide whether to index or cite a page. Keep project descriptions
and experience accurate and current; the machine-readable data uses the same
content as the portfolio.

References:
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
