import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { jobs, website } from './site.data';

describe('JSON-backed careers', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes)] }));

  it('links every listed job to its details', async () => {
    const harness = await RouterTestingHarness.create('/jobs');
    const links = Array.from(harness.routeNativeElement!.querySelectorAll('a')).map(a => a.getAttribute('href'));
    for (const job of jobs) expect(links).toContain('/jobs/' + job.slug);
  });

  it('loads descriptions and updates when navigating between roles', async () => {
    const harness = await RouterTestingHarness.create();
    for (const job of jobs) {
      await harness.navigateByUrl('/jobs/' + job.slug);
      expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe(job.title);
      expect(harness.routeNativeElement!.textContent).toContain(job.responsibilities[0]);
      const application = harness.routeNativeElement!.querySelector('a[href^="mailto:"]')!;
      expect(application.getAttribute('href')).toBe(`mailto:${website.company.email}?subject=${encodeURIComponent('Application - ' + job.title)}`);
    }
  });

  it('offers a way back for an unknown job', async () => {
    const harness = await RouterTestingHarness.create('/jobs/missing-job');
    expect(harness.routeNativeElement!.textContent).toContain(website.careers.missingTitle);
    expect(harness.routeNativeElement!.querySelector('a')?.getAttribute('href')).toBe('/jobs');
  });
});
