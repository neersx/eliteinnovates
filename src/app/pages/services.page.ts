import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { services } from '../site.data';
import content from '../data/showcase.json';
import { ShowcaseCta } from './showcase.shared';

@Component({
  selector: 'app-services-page',
  imports: [RouterLink, ShowcaseCta],
  templateUrl: './services.page.html'
})
export class ServicesPage {
  services = services;
  content = content;
}
