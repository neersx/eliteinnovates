# Website content and SEO

Edit `src/app/data/seo.json` to maintain the major pages' titles, descriptions, visible guide sections, questions and internal links. Each `path` must match an Angular route. The JSON is bundled with the application so content is available in the initial prerendered HTML without a separate browser fetch.

The covered routes are home, services, portfolio, about, contact, careers, vision and mission, privacy policy, and terms. Individual job titles and descriptions come from `src/app/data/jobs.json`. Keep descriptions accurate and specific to the page. Use existing company and project details when adding copy.

`SeoStrategy` updates the title, description, canonical URL, robots directive, Open Graph tags, Twitter tags and JSON-LD on initial render and client navigation. Canonicals use `https://eliteinnovates.com` and omit query parameters and fragments. Structured data describes the organization, website, current page, breadcrumbs and the service catalogue. Missing URLs and missing job slugs receive `noindex`; server-rendered missing pages return HTTP 404.

`npm run build` runs `scripts/generate-seo.mjs` before Angular builds. The generator writes `public/sitemap.xml` and `public/robots.txt` from the SEO and jobs JSON. Do not edit the generated URL list manually. When adding a page, add its Angular route and JSON entry; the server prerender route list follows the JSON. No artificial modification dates are added to the sitemap.

Run `npm test -- --watch=false` to check navigation and metadata. After building, inspect `dist/eliteinnovates/browser/<route>/index.html` for the rendered title, description, canonical link, visible guide text and the `page-structured-data` script. The normal deployment scripts copy these files with the app. After deploying, submit `https://eliteinnovates.com/sitemap.xml` through the site's Google Search Console property.

Implementation references: [Angular SSR and metadata](https://angular.dev/best-practices/performance/ssr), [Angular TitleStrategy](https://angular.dev/api/router/TitleStrategy), and [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
