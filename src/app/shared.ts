import { website } from './site.data';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { projects, services } from './site.data';

@Component({
  selector: 'app-service-grid', imports: [RouterLink],
  template: `<div class="service-grid">@for (service of items; track service.title) {<article class="service-card"><div class="service-icon">{{service.icon}}</div><h3>{{service.title}}</h3><p>{{service.short}}</p>@if (detailed) {<ul>@for(point of service.points; track point){<li>{{point}}</li>}</ul>}<a routerLink="/contact" class="text-link">{{website.copy.Discuss_this_service}}<span>→</span></a></article>}</div>`
})
export class ServiceGrid { website = website; @Input() detailed = false; items = services; }

@Component({
  selector: 'app-project-grid',
  template: `<div class="project-grid">@for (project of items; track project.title) {<article class="project-card"><div class="project-visual {{project.kind}}"><span class="project-index">{{project.index}}</span><div class="device laptop"><div class="screen"><small>{{project.tag}}</small><strong>{{project.title}}</strong><i></i><i></i><i></i></div></div><div class="device phone"><div class="screen"><b>{{project.title.charAt(0)}}</b><i></i><i></i></div></div></div><div class="project-info"><span>{{project.tag}}</span><h3>{{project.title}}</h3><p>{{project.copy}}</p>@if(project.url){<a [href]="'https://' + project.url" target="_blank" rel="noopener">{{project.url}} ↗</a>}@else{<span class="project-private">{{website.copy.Private_client_product}}</span>}</div></article>}</div>`
})
export class ProjectGrid { website = website; items = projects; }

@Component({
  selector: 'app-cta', imports: [RouterLink],
  template: `<section class="cta-band"><div><span class="eyebrow">{{website.copy.LET_S_WORK_TOGETHER}}</span><h2>{{website.copy.Let_s_build_your_next_chapter}}</h2><p>{{website.copy.Share_your_idea_with_us_We_ll_help_turn_it_into_a_useful_digital_product}}</p></div><div class="cta-contact"><a [href]="'mailto:' + website.company.email">{{website.company.email}}</a><span>{{website.copy.Apex_Golf_Sec_1_New_Delhi_INDIA}}</span></div><a routerLink="/contact" class="button button-primary">{{website.copy.Start_a_conversation}}<span>→</span></a></section>`
})
export class CtaBand { website = website;}
