import { JobsPage, JobDetailsPage } from './pages/jobs.page';
import { jobs, website } from './site.data';
import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { ServicesPage } from './pages/services.page';
import { PortfolioPage } from './pages/portfolio.page';
import { AboutPage, ContactPage, LegalPage, VisionPage } from './pages/content.pages';

export const routes: Routes = [
  { path: '', component: HomePage, title: website.pageTitles.Elite_Innovates_Build_smarter_Grow_faster },
  { path: 'services', component: ServicesPage, title: website.pageTitles.Our_Services_Elite_Innovates },
  { path: 'about', component: AboutPage, title: website.pageTitles.About_Us_Elite_Innovates },
  { path: 'contact', component: ContactPage, title: website.pageTitles.Contact_Us_Elite_Innovates },
  { path: 'portfolio', component: PortfolioPage, title: website.pageTitles.Portfolio_Elite_Innovates },
  { path: 'jobs/:slug', component: JobDetailsPage, title: route => `${jobs.find(job => job.slug === route.paramMap.get('slug'))?.title ?? website.careers.missingTitle} | ${website.company.name}` },
  { path: 'jobs', component: JobsPage, title: website.pageTitles.Jobs_Elite_Innovates },
  { path: 'privacy-policy', component: LegalPage, data: { type: 'privacy' }, title: website.pageTitles.Privacy_Policy_Elite_Innovates },
  { path: 'terms', component: LegalPage, data: { type: 'terms' }, title: website.pageTitles.Terms_Conditions_Elite_Innovates },
  { path: 'vision-mission', component: VisionPage, title: website.pageTitles.Vision_Mission_Elite_Innovates },
  { path: '**', redirectTo: '' }
];
