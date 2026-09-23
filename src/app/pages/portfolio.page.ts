import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { projects } from '../site.data';
import content from '../data/showcase.json';
import { ShowcaseCta } from './showcase.shared';

@Component({
  selector: 'app-portfolio-page',
  imports: [RouterLink, ShowcaseCta],
  templateUrl: './portfolio.page.html'
})
export class PortfolioPage {
  projects = projects;
  content = content;
  selectedCategory = signal('all');
  filteredProjects = computed(() => projects.filter(project => this.selectedCategory() === 'all' || project.categories.includes(this.selectedCategory())));
  categoryCount(category: string) {
    return category === 'all' ? projects.length : projects.filter(project => project.categories.includes(category)).length;
  }
}
