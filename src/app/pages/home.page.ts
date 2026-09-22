import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaBand, ProjectGrid, ServiceGrid } from '../shared';

@Component({
  selector: 'app-home', imports: [RouterLink, ServiceGrid, ProjectGrid, CtaBand],
  template: `
  <section class="hero">
    <div class="hero-orb one"></div><div class="hero-orb two"></div>
    <div class="hero-content shell">
      <div class="hero-copy"><span class="eyebrow">IDEAS · TECHNOLOGY · REAL IMPACT</span><h1>Build smarter.<br><em>Grow faster.</em></h1><p>Websites, software, mobile apps and automation built around your business.</p><div class="hero-actions"><a routerLink="/services" class="button button-primary">Explore Our Services <span>→</span></a><a routerLink="/contact" class="button button-outline">Let’s Talk</a></div><div class="hero-values"><span><b>◎</b> Tailored solutions</span><span><b>ϟ</b> Modern technology</span><span><b>⌁</b> Your growth, our focus</span></div></div>
      <div class="hero-stage" aria-label="Conceptual website and mobile application preview"><div class="shape shape-a"></div><div class="shape shape-b"></div><div class="hero-laptop"><div class="browser-bar"><i></i><i></i><i></i></div><div class="hero-screen"><small>ELITE INNOVATES</small><h3>Turn ideas into<br><em>real solutions.</em></h3><p>Technology for a brighter tomorrow.</p><span>Get started →</span><div class="screen-art"></div></div></div><div class="hero-phone"><div class="phone-notch"></div><small>Good morning</small><h4>Let’s build<br>together.</h4><div class="app-grid"><i>▣</i><i>⚙</i><i>▤</i><i>↗</i></div></div><p class="scribble">Innovate<br>Automate<br>Grow ↙</p></div>
    </div>
  </section>
  <section class="section shell"><div class="section-head centered"><span class="eyebrow blue">OUR SERVICES</span><h2>End-to-end digital solutions for <em>your business</em></h2><p>From idea to execution, we design, develop and deliver technology that helps you work smarter, serve better and grow faster.</p></div><app-service-grid /></section>
  <section class="section portfolio-section"><div class="shell"><div class="section-head split"><div><span class="eyebrow blue">OUR PORTFOLIO</span><h2>Ideas we’ve brought to life</h2></div><p>A glimpse of products and platforms built with our clients.</p><a routerLink="/portfolio" class="text-link">View all projects <span>→</span></a></div><app-project-grid /></div></section>
  <section class="section shell about-split"><div class="about-image"><div class="portrait-shape p1"></div><div class="portrait-shape p2"></div><div class="people"><span></span><span></span><span></span></div><b>People<br>Ideas<br>Possibilities</b></div><div class="about-copy"><span class="eyebrow blue">ABOUT US</span><h2>Technology with a <em>purpose.</em></h2><h3>Elite Innovates Solutions Private Limited</h3><p>We help businesses innovate, automate and grow by combining thoughtful strategy, practical engineering and digital experiences designed around real goals.</p><p>Every engagement begins with understanding the problem, then building a clear path toward useful, dependable technology.</p><a routerLink="/about" class="button button-soft">Learn more about us <span>→</span></a></div></section>
  <app-cta />`
})
export class HomePage {}
