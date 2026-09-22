import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { ServicesPage } from './pages/services.page';
import { PortfolioPage } from './pages/portfolio.page';
import { AboutPage, ContactPage, JobsPage, LegalPage, VisionPage } from './pages/content.pages';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Elite Innovates | Build smarter. Grow faster.' },
  { path: 'services', component: ServicesPage, title: 'Our Services | Elite Innovates' },
  { path: 'about', component: AboutPage, title: 'About Us | Elite Innovates' },
  { path: 'contact', component: ContactPage, title: 'Contact Us | Elite Innovates' },
  { path: 'portfolio', component: PortfolioPage, title: 'Portfolio | Elite Innovates' },
  { path: 'jobs', component: JobsPage, title: 'Jobs | Elite Innovates' },
  { path: 'privacy-policy', component: LegalPage, data: { type: 'privacy' }, title: 'Privacy Policy | Elite Innovates' },
  { path: 'terms', component: LegalPage, data: { type: 'terms' }, title: 'Terms & Conditions | Elite Innovates' },
  { path: 'vision-mission', component: VisionPage, title: 'Vision & Mission | Elite Innovates' },
  { path: '**', redirectTo: '' }
];
