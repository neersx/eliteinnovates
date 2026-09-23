import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { applicationLink, jobs, website } from '../site.data';

@Component({
  selector: 'app-jobs-page', imports: [RouterLink],
  template: `<section class="page-hero jobs-hero"><div class="shell"><span class="eyebrow">{{copy.eyebrow}}</span><h1>{{copy.title}} <em>{{copy.accent}}</em></h1><p>{{copy.intro}}</p></div></section>
  <section class="section shell"><div class="section-head split"><div><span class="eyebrow blue">{{copy.open}}</span><h2>{{copy.heading}}</h2></div><p>{{copy.description}}</p></div><div class="jobs-list">@for(job of jobs; track job.slug){<article><div><span>{{job.department}}</span><h3><a [routerLink]="['/jobs',job.slug]">{{job.title}}</a></h3><p>{{job.skills.join(' · ')}} · {{job.location}} / {{job.workplace}}</p></div><a [routerLink]="['/jobs',job.slug]" class="button button-soft" [attr.aria-label]="copy.view + ': ' + job.title">{{copy.view}} →</a></article>}</div><p class="jobs-note">{{copy.note}} <a [href]="'mailto:' + company.email">{{company.email}}</a>.</p></section>`
})
export class JobsPage { jobs = jobs; copy = website.careers; company = website.company; }

@Component({
  selector: 'app-job-details-page', imports: [RouterLink],
  template: `@if(job(); as role){
    <section class="page-hero job-hero"><div class="shell"><a routerLink="/jobs" class="job-back">← {{copy.back}}</a><span class="eyebrow">{{role.department}}</span><h1>{{role.title}}</h1><p>{{role.summary}}</p><div class="job-tags"><span>{{role.location}}</span><span>{{role.workplace}}</span>@for(skill of role.skills; track skill){<span>{{skill}}</span>}</div></div></section>
    <div class="section shell job-layout"><article class="job-description"><section><span class="eyebrow blue">{{company.name}}</span><h2>{{copy.about}}</h2>@for(paragraph of role.description; track paragraph){<p>{{paragraph}}</p>}</section><section><h2>{{copy.responsibilities}}</h2><ul>@for(item of role.responsibilities; track item){<li>{{item}}</li>}</ul></section><section><h2>{{copy.requirements}}</h2><ul>@for(item of role.requirements; track item){<li>{{item}}</li>}</ul></section>@if(role.niceToHave.length){<section><h2>{{copy.niceToHave}}</h2><ul>@for(item of role.niceToHave; track item){<li>{{item}}</li>}</ul></section>}</article>
    <aside class="job-sidebar"><div class="job-summary"><h2>{{copy.overview}}</h2><dl><dt>{{copy.department}}</dt><dd>{{role.department}}</dd><dt>{{copy.location}}</dt><dd>{{role.location}}</dd><dt>{{copy.workplace}}</dt><dd>{{role.workplace}}</dd></dl><h3>{{copy.applyHeading}}</h3><p>{{copy.applyCopy}}</p><a [href]="applicationLink(role)" class="button button-primary">{{copy.apply}} ↗</a><a class="job-email" [href]="applicationLink(role)">{{company.email}}</a></div></aside></div>
    <section class="shell job-related"><h2>{{copy.related}}</h2><div class="jobs-list">@for(other of related(); track other.slug){<article><div><span>{{other.department}}</span><h3><a [routerLink]="['/jobs',other.slug]">{{other.title}}</a></h3><p>{{other.location}} / {{other.workplace}}</p></div><a class="text-link" [routerLink]="['/jobs',other.slug]" [attr.aria-label]="copy.view + ': ' + other.title">{{copy.view}} →</a></article>}</div></section>
  }@else{<section class="page-hero"><div class="shell"><span class="eyebrow">{{copy.eyebrow}}</span><h1>{{copy.missingTitle}}</h1><p>{{copy.missingCopy}}</p><a routerLink="/jobs" class="button button-primary">← {{copy.back}}</a></div></section>}`
})
export class JobDetailsPage {
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  job = computed(() => jobs.find(job => job.slug === this.params().get('slug')));
  related = computed(() => jobs.filter(job => job.slug !== this.job()?.slug));
  copy = website.careers;
  company = website.company;
  applicationLink = applicationLink;
}
