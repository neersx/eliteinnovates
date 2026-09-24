import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found', imports: [RouterLink],
  template: `<section class="page-hero"><div class="shell"><span class="eyebrow">404</span><h1>Page not found</h1><p>The page may have moved or the address may be incorrect.</p><a routerLink="/" class="button button-primary">Return home</a></div></section>`
})
export class NotFoundPage {}
