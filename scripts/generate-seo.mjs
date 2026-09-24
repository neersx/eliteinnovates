import { readFileSync, writeFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const seo = read('../src/app/data/seo.json');
const jobs = read('../src/app/data/jobs.json');
const paths = [...seo.pages.map(page => page.path), ...jobs.map(job => '/jobs/' + job.slug)];
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + paths.map(path => `  <url><loc>${escapeXml(seo.site.url + path)}</loc></url>`).join('\n') + '\n</urlset>\n');
writeFileSync(new URL('../public/robots.txt', import.meta.url), `User-agent: *\nAllow: /\n\nSitemap: ${seo.site.url}/sitemap.xml\n`);
