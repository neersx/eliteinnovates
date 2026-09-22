import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { projects, services } from './site.data';

@Component({
  selector: 'app-service-grid', imports: [RouterLink],
  template: `<div class="service-grid">@for (service of items; track service.title) {<article class="service-card"><div class="service-icon">{{service.icon}}</div><h3>{{service.title}}</h3><p>{{service.short}}</p>@if (detailed) {<ul>@for(point of service.points; track point){<li>{{point}}</li>}</ul>}<a routerLink="/contact" class="text-link">Discuss this service <span>→</span></a></article>}</div>`
})
export class ServiceGrid { @Input() detailed = false; items = services; }

@Component({
  selector: 'app-project-grid',
  template: `<div class="project-grid">@for (project of items; track project.title) {<article class="project-card"><div class="project-visual {{project.kind}}"><span class="project-index">{{project.index}}</span><div class="device laptop"><div class="screen"><small>{{project.tag}}</small><strong>{{project.title}}</strong><i></i><i></i><i></i></div></div><div class="device phone"><div class="screen"><b>{{project.title.charAt(0)}}</b><i></i><i></i></div></div></div><div class="project-info"><span>{{project.tag}}</span><h3>{{project.title}}</h3><p>{{project.copy}}</p>@if(project.url){<a [href]="'https://' + project.url" target="_blank" rel="noopener">{{project.url}} ↗</a>}@else{<span class="project-private">Private client product</span>}</div></article>}</div>`
})
export class ProjectGrid { items = projects; }

@Component({
  selector: 'app-cta', imports: [RouterLink],
  template: `<section class="cta-band"><div><span class="eyebrow">LET’S WORK TOGETHER</span><h2>Let’s build your next chapter.</h2><p>Share your idea with us. We’ll help turn it into a useful digital product.</p></div><div class="cta-contact"><a href="mailto:info@eliteinnovates.com">info@eliteinnovates.com</a><span>Apex Golf, Sec 1, New Delhi, INDIA</span></div><a routerLink="/contact" class="button button-primary">Start a conversation <span>→</span></a></section>`
})
export class CtaBand {}
