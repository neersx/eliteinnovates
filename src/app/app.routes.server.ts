import { jobs } from './site.data';
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'jobs/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => jobs.map(job => ({ slug: job.slug })) },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
