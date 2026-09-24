import { TestBed } from '@angular/core/testing';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { SeoStrategy } from './seo.strategy';
import seo from '../data/seo.json';
import { jobs } from '../site.data';

describe('Route SEO', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideRouter(routes), { provide: TitleStrategy, useExisting: SeoStrategy }
  ] }));

  it('updates metadata without duplicates and strips queries and fragments from canonicals', async () => {
    const harness = await RouterTestingHarness.create();
    for (const page of seo.pages) {
      await harness.navigateByUrl(page.path + '?utm_source=test#details');
      expect(document.title).toBe(page.title);
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(page.description);
      expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
      expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(seo.site.url + page.path);
      expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(page.title);
      expect(document.querySelectorAll('#page-structured-data')).toHaveLength(1);
      const graph = JSON.parse(document.getElementById('page-structured-data')!.textContent!)['@graph'];
      expect(graph.some((item: { url: string }) => item.url === seo.site.url + page.path)).toBe(true);
    }
  });

  it('uses job content, noindexes missing pages, and restores metadata on navigation', async () => {
    const harness = await RouterTestingHarness.create('/jobs/' + jobs[0].slug);
    expect(document.title).toContain(jobs[0].title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(jobs[0].summary);
    for (const path of ['/jobs/not-a-role', '/missing-page']) {
      await harness.navigateByUrl(path);
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,follow');
      expect(document.getElementById('page-structured-data')).toBeNull();
    }
    await harness.navigateByUrl('/services');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('index,follow');
    expect(TestBed.inject(SeoStrategy).page()?.sections.length).toBeGreaterThan(0);
  });
});
