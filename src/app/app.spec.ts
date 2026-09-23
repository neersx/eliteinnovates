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

describe('Portfolio discovery', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes)] }));

  it('filters the visible work and restores the full collection', async () => {
    const harness = await RouterTestingHarness.create('/portfolio');
    const page = harness.routeNativeElement!;
    const titles = () => Array.from(page.querySelectorAll('.case-title-row h3')).map(el => el.textContent?.trim());
    const choose = async (label: string) => {
      const button = Array.from(page.querySelectorAll<HTMLButtonElement>('.portfolio-filters button')).find(el => el.textContent?.includes(label))!;
      button.click();
      harness.detectChanges();
      await harness.fixture.whenStable();
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(page.querySelectorAll('.portfolio-filters button[aria-pressed="true"]').length).toBe(1);
    };

    expect(titles()).toHaveLength(4);
    await choose('Mobile experiences');
    expect(titles()).toEqual(['Invita Videos']);
    expect(page.querySelector('[role="status"]')?.textContent?.trim()).toBe('1 project');
    await choose('Business tools');
    expect(titles()).toEqual(['Real Estate Sales Management']);
    expect(page.querySelector('.case-footer a')?.getAttribute('href')).toBe('/contact');
    await choose('AI & learning');
    expect(titles()).toEqual(['Quizlo AI']);
    await choose('All work');
    expect(titles()).toEqual(['Dream Wedds', 'Quizlo AI', 'Invita Videos', 'Real Estate Sales Management']);
    expect(page.querySelector('[role="status"]')?.textContent?.trim()).toBe('4 projects');
  });
});
