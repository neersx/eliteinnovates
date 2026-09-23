import { website } from '../site.data';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaBand, ServiceGrid } from '../shared';

@Component({
  selector: 'app-services-page', imports: [RouterLink, ServiceGrid, CtaBand],
  template: `<section class="page-hero"><div class="shell"><span class="eyebrow">{{website.copy.WHAT_WE_DO}}</span><h1>{{website.copy.Digital_solutions_built_around}}<em>{{website.copy.your_business}}</em></h1><p>{{website.copy.One_team_for_strategy_design_development_automation_and_ongoing_technology_}}</p><a routerLink="/contact" class="button button-primary">{{website.copy.Start_your_project}}<span>→</span></a></div></section>
  <section class="section shell"><div class="section-head"><span class="eyebrow blue">{{website.copy.OUR_SERVICES}}</span><h2>{{website.copy.From_the_first_idea_to_everyday_impact}}</h2><p>{{website.copy.Choose_a_focused_service_or_combine_capabilities_into_one_connected_engagem}}</p></div><app-service-grid [detailed]="true" /></section>
  <section class="section dark-panel shell"><div><span class="eyebrow">{{website.copy.HOW_WE_WORK}}</span><h2>{{website.copy.Clear_thinking_Practical_delivery}}</h2></div><div class="process"><article><b>01</b><h3>{{website.copy.Discover}}</h3><p>{{website.copy.We_understand_your_goals_audience_and_current_workflow}}</p></article><article><b>02</b><h3>{{website.copy.Design}}</h3><p>{{website.copy.We_shape_the_experience_and_define_a_useful_technical_path}}</p></article><article><b>03</b><h3>{{website.copy.Build}}</h3><p>{{website.copy.We_develop_test_and_refine_the_solution_with_you}}</p></article><article><b>04</b><h3>{{website.copy.Grow}}</h3><p>{{website.copy.We_support_the_product_and_help_it_evolve_with_your_needs}}</p></article></div></section><app-cta />`
})
export class ServicesPage { website = website;}
