import { Component } from '@angular/core';
import { CtaBand, ProjectGrid } from '../shared';

@Component({
  selector: 'app-portfolio-page', imports: [ProjectGrid, CtaBand],
  template: `<section class="page-hero portfolio-hero"><div class="shell"><span class="eyebrow">SELECTED WORK</span><h1>Products made to solve <em>real problems.</em></h1><p>Explore digital experiences created in collaboration with ambitious clients.</p></div></section>
  <section class="section shell"><div class="section-head split"><div><span class="eyebrow blue">OUR PORTFOLIO</span><h2>Ideas we’ve brought to life</h2></div><p>Each project starts with a distinct goal and ends with a product made for the people who use it.</p></div><app-project-grid /></section>
  <section class="section shell results-strip"><div><strong>4</strong><span>Featured client products</span></div><div><strong>3</strong><span>Web platforms</span></div><div><strong>2</strong><span>Mobile experiences</span></div><div><strong>1</strong><span>Committed technology partner</span></div></section><app-cta />`
})
export class PortfolioPage {}
