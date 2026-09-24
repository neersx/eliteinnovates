import { DOCUMENT, Injectable, RESPONSE_INIT, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import content from '../data/seo.json';
import { jobs, services, website } from '../site.data';

export type SeoPage = (typeof content.pages)[number];

@Injectable({ providedIn: 'root' })
export class SeoStrategy extends TitleStrategy {
  readonly page = signal<SeoPage | null>(null);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly response = inject(RESPONSE_INIT, { optional: true });

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const path = snapshot.url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
    const page = content.pages.find(item => item.path === path);
    const job = jobs.find(item => path === '/jobs/' + item.slug);
    const title = page?.title ?? (job ? `${job.title} Careers | Elite Innovates` : 'Page Not Found | Elite Innovates');
    const description = page?.description ?? job?.summary ?? 'This page is unavailable. Explore Elite Innovates services, projects and careers.';
    const url = content.site.url + (path === '/' ? '/' : path);
    this.page.set(page ?? null);
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: page || job ? 'index,follow,max-image-preview:large' : 'noindex,follow' });
    for (const [property, value] of Object.entries({
      'og:type': 'website', 'og:site_name': content.site.name, 'og:title': title,
      'og:description': description, 'og:url': url, 'og:image': content.site.url + content.site.image,
      'og:image:alt': content.site.imageAlt, 'og:locale': 'en_IN'
    })) this.meta.updateTag({ property, content: value });
    for (const [name, value] of Object.entries({
      'twitter:card': 'summary_large_image', 'twitter:title': title,
      'twitter:description': description, 'twitter:image': content.site.url + content.site.image,
      'twitter:image:alt': content.site.imageAlt
    })) this.meta.updateTag({ name, content: value });

    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
    this.document.getElementById('page-structured-data')?.remove();
    if (!page && !job) {
      if (this.response) this.response.status = 404;
      return;
    }
    const organization = { '@type': 'Organization', '@id': content.site.url + '/#organization',
      name: website.company.name, legalName: website.company.legalName, url: content.site.url,
      email: website.company.email, logo: content.site.url + website.company.logo };
    const graph: object[] = [organization,
      { '@type': 'WebSite', '@id': content.site.url + '/#website', url: content.site.url,
        name: content.site.name, publisher: { '@id': organization['@id'] } },
      { '@type': path === '/contact' ? 'ContactPage' : path === '/about' ? 'AboutPage' : 'WebPage',
        '@id': url + '#page', url, name: title, description, inLanguage: content.site.language,
        isPartOf: { '@id': content.site.url + '/#website' } }
    ];
    if (path !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: content.site.url + '/' },
      ...(job ? [{ '@type': 'ListItem', position: 2, name: 'Careers', item: content.site.url + '/jobs' }] : []),
      { '@type': 'ListItem', position: job ? 3 : 2, name: job?.title ?? title.split(' | ')[0], item: url }
    ] });
    if (path === '/services') graph.push(...services.map(service => ({
      '@type': 'Service', name: service.title, description: service.description,
      url: url + '#' + service.id, provider: { '@id': organization['@id'] }
    })));
    const script = this.document.createElement('script');
    script.id = 'page-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }
}
