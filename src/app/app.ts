import { website } from './site.data';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  website = website;
  menuOpen = signal(false);
  year = new Date().getFullYear();
  closeMenu() { this.menuOpen.set(false); }
}
