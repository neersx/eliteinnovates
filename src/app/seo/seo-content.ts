import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoStrategy } from './seo.strategy';

@Component({
  selector: 'app-seo-content',
  imports: [RouterLink],
  template: `@if (seo.page(); as page) {
    @if (page.sections.length) {
      <section class="section shell" aria-labelledby="page-guide-heading">
        <h2 id="page-guide-heading">{{page.heading}}</h2>
        <div class="guide-grid">@for (section of page.sections; track section.heading) {
          <article><h3>{{section.heading}}</h3><p>{{section.body}}</p></article>
        }</div>
        @if (page.faqs.length) {
          <div class="guide-faq"><h2>Frequently asked questions</h2>
            @for (faq of page.faqs; track faq.question) {
              <details><summary>{{faq.question}}</summary><p>{{faq.answer}}</p></details>
            }
          </div>
        }
        <a class="text-link" [routerLink]="page.link">{{page.linkLabel}} →</a>
      </section>
    }
  }`,
  styles: `:host{display:block;background:#f6f9fc}.guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:32px;margin:32px 0}h3{font-size:1.2rem;margin-bottom:12px}p{line-height:1.8;color:#536579}.guide-faq{max-width:850px;margin:40px 0}details{padding:20px 0;border-bottom:1px solid #dce5ec}summary{cursor:pointer;font-weight:600}details p{margin-top:14px}`
})
export class SeoContent { readonly seo = inject(SeoStrategy); }
