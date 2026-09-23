import { website } from '../site.data';
import { Component } from '@angular/core';
import { CtaBand, ProjectGrid } from '../shared';

@Component({
  selector: 'app-portfolio-page', imports: [ProjectGrid, CtaBand],
  template: `<section class="page-hero portfolio-hero"><div class="shell"><span class="eyebrow">{{website.copy.SELECTED_WORK}}</span><h1>{{website.copy.Products_made_to_solve}}<em>{{website.copy.real_problems}}</em></h1><p>{{website.copy.Explore_digital_experiences_created_in_collaboration_with_ambitious_clients}}</p></div></section>
  <section class="section shell"><div class="section-head split"><div><span class="eyebrow blue">{{website.copy.OUR_PORTFOLIO}}</span><h2>{{website.copy.Ideas_we_ve_brought_to_life}}</h2></div><p>{{website.copy.Each_project_starts_with_a_distinct_goal_and_ends_with_a_product_made_for_t}}</p></div><app-project-grid /></section>
  <section class="section shell results-strip"><div><strong>4</strong><span>{{website.copy.Featured_client_products}}</span></div><div><strong>3</strong><span>{{website.copy.Web_platforms}}</span></div><div><strong>2</strong><span>{{website.copy.Mobile_experiences}}</span></div><div><strong>1</strong><span>{{website.copy.Committed_technology_partner}}</span></div></section><app-cta />`
})
export class PortfolioPage { website = website;}
