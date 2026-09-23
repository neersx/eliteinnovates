import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { website } from '../site.data';

@Component({
  selector: 'app-showcase-cta',
  imports: [RouterLink],
  template: `
    <section class="studio-cta studio-wrap" aria-labelledby="studio-cta-heading">
      <div>
        <span class="studio-kicker">YOUR NEXT CHAPTER</span>
        <h2 id="studio-cta-heading">{{ heading }}<br><em>{{ accent }}</em></h2>
        <p>{{ description }}</p>
      </div>
      <div class="studio-cta-actions">
        <a routerLink="/contact" class="studio-button">Let’s talk about your project <span aria-hidden="true">↗</span></a>
        <a class="studio-email" [href]="'mailto:' + website.company.email">{{ website.company.email }}</a>
      </div>
    </section>`
})
export class ShowcaseCta {
  website = website;
  @Input() heading = 'Have something in mind?';
  @Input() accent = 'Let’s make it happen.';
  @Input() description = 'Tell us where you want to go. We’ll help you work out the next step.';
}
