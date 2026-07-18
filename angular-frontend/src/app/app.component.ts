import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthModalComponent } from './shared/components/auth-modal/auth-modal.component';

/**
 * Root App Component — renders global navigation and page content.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AuthModalComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-auth-modal></app-auth-modal>
  `
})
export class AppComponent {}
