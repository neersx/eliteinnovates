import { website } from '../site.data';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaBand, ProjectGrid, ServiceGrid } from '../shared';

@Component({
  selector: 'app-home', imports: [RouterLink, ServiceGrid, ProjectGrid, CtaBand],
  template: `
  <section class="hero">
    <div class="hero-orb one"></div><div class="hero-orb two"></div>
    <div class="hero-content shell">
      <div class="hero-copy"><span class="eyebrow">{{website.copy.IDEAS_TECHNOLOGY_REAL_IMPACT}}</span><h1>{{website.copy.Build_smarter}}<br><em>{{website.copy.Grow_faster}}</em></h1><p>{{website.copy.Websites_software_mobile_apps_and_automation_built_around_your_business}}</p><div class="hero-actions"><a routerLink="/services" class="button button-primary">{{website.copy.Explore_Our_Services}}<span>→</span></a><a routerLink="/contact" class="button button-outline">{{website.copy.Let_s_Talk_2}}</a></div><div class="hero-values"><span><b>◎</b>{{website.copy.Tailored_solutions}}</span><span><b>ϟ</b>{{website.copy.Modern_technology}}</span><span><b>⌁</b>{{website.copy.Your_growth_our_focus}}</span></div></div>
      <div class="hero-stage" [attr.aria-label]="website.copy.Conceptual_website_and_mobile_application_preview"><div class="shape shape-a"></div><div class="shape shape-b"></div><div class="hero-laptop"><div class="browser-bar"><i></i><i></i><i></i></div><div class="hero-screen"><small>{{website.copy.ELITE_INNOVATES}}</small><h3>{{website.copy.Turn_ideas_into}}<br><em>{{website.copy.real_solutions}}</em></h3><p>{{website.copy.Technology_for_a_brighter_tomorrow}}</p><span>{{website.copy.Get_started}}</span><div class="screen-art"></div></div></div><div class="hero-phone"><div class="phone-notch"></div><small>{{website.copy.Good_morning}}</small><h4>{{website.copy.Let_s_build}}<br>{{website.copy.together}}</h4><div class="app-grid"><i>▣</i><i>⚙</i><i>▤</i><i>↗</i></div></div><p class="scribble">{{website.copy.Innovate}}<br>{{website.copy.Automate}}<br>{{website.copy.Grow_2}}</p></div>
    </div>
  </section>
  <section class="section shell"><div class="section-head centered"><span class="eyebrow blue">{{website.copy.OUR_SERVICES}}</span><h2>{{website.copy.End_to_end_digital_solutions_for}}<em>{{website.copy.your_business_2}}</em></h2><p>{{website.copy.From_idea_to_execution_we_design_develop_and_deliver_technology_that_helps_}}</p></div><app-service-grid /></section>
  <section class="section portfolio-section"><div class="shell"><div class="section-head split"><div><span class="eyebrow blue">{{website.copy.OUR_PORTFOLIO}}</span><h2>{{website.copy.Ideas_we_ve_brought_to_life}}</h2></div><p>{{website.copy.A_glimpse_of_products_and_platforms_built_with_our_clients}}</p><a routerLink="/portfolio" class="text-link">{{website.copy.View_all_projects}}<span>→</span></a></div><app-project-grid /></div></section>
  <section class="section shell about-split"><div class="about-image"><div class="portrait-shape p1"></div><div class="portrait-shape p2"></div><div class="people"><span></span><span></span><span></span></div><b>{{website.copy.People}}<br>{{website.copy.Ideas}}<br>{{website.copy.Possibilities}}</b></div><div class="about-copy"><span class="eyebrow blue">{{website.copy.ABOUT_US}}</span><h2>{{website.copy.Technology_with_a}}<em>{{website.copy.purpose}}</em></h2><h3>{{website.copy.Elite_Innovates_Solutions_Private_Limited}}</h3><p>{{website.copy.We_help_businesses_innovate_automate_and_grow_by_combining_thoughtful_strat}}</p><p>{{website.copy.Every_engagement_begins_with_understanding_the_problem_then_building_a_clea}}</p><a routerLink="/about" class="button button-soft">{{website.copy.Learn_more_about_us}}<span>→</span></a></div></section>
  <app-cta />`
})
export class HomePage { website = website;}
