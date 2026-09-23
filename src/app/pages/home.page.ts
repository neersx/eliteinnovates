import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { projects, services, website } from '../site.data';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.page.html'
})
export class HomePage {
  website = website;
  serviceImages = ['web', 'automation', 'mobile', 'whatsapp', 'marketing', 'it'];
  serviceDescriptions = [
    'Modern, high-performance websites and custom software built around your goals.',
    'Streamline operations, reduce manual work and boost productivity with smart automation.',
    'Powerful and user-friendly Android & iOS apps tailored to your business.',
    'Engage customers, automate conversations and grow with WhatsApp Business solutions.',
    'Strategy-driven digital marketing to increase your visibility and reach the right audience.',
    'Reliable IT infrastructure, cloud solutions and ongoing technical support.'
  ];
  services = services;
  projects = projects;
  projectImages = ['dream-wedds', 'quizlo-ai', 'invita-videos', 'real-estate'];
}
