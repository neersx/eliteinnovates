import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaBand, ServiceGrid } from '../shared';

@Component({
  selector: 'app-services-page', imports: [RouterLink, ServiceGrid, CtaBand],
  template: `<section class="page-hero"><div class="shell"><span class="eyebrow">WHAT WE DO</span><h1>Digital solutions built around <em>your business.</em></h1><p>One team for strategy, design, development, automation and ongoing technology support.</p><a routerLink="/contact" class="button button-primary">Start your project <span>→</span></a></div></section>
  <section class="section shell"><div class="section-head"><span class="eyebrow blue">OUR SERVICES</span><h2>From the first idea to everyday impact</h2><p>Choose a focused service or combine capabilities into one connected engagement.</p></div><app-service-grid [detailed]="true" /></section>
  <section class="section dark-panel shell"><div><span class="eyebrow">HOW WE WORK</span><h2>Clear thinking. Practical delivery.</h2></div><div class="process"><article><b>01</b><h3>Discover</h3><p>We understand your goals, audience and current workflow.</p></article><article><b>02</b><h3>Design</h3><p>We shape the experience and define a useful technical path.</p></article><article><b>03</b><h3>Build</h3><p>We develop, test and refine the solution with you.</p></article><article><b>04</b><h3>Grow</h3><p>We support the product and help it evolve with your needs.</p></article></div></section><app-cta />`
})
export class ServicesPage {}
