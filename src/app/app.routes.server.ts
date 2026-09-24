import { jobs } from './site.data';
import content from './data/seo.json';
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  ...content.pages.map<ServerRoute>(page => ({ path: page.path.slice(1), renderMode: RenderMode.Prerender })),
  { path: 'jobs/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => jobs.map(job => ({ slug: job.slug })) },
  { path: '**', renderMode: RenderMode.Server }
];
