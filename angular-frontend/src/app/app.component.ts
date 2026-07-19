import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthModalComponent } from './shared/components/auth-modal/auth-modal.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

/**
 * Root App Component — renders global navigation and page content.
 * Controls navbar visibility based on the current route.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AuthModalComponent, CommonModule],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <router-outlet></router-outlet>
    <app-auth-modal></app-auth-modal>
  `
})
export class AppComponent {
  private router = inject(Router);
  showNavbar = true;

  // Routes where the global navbar should be hidden
  // (these pages have their own dark dashboard-style header)
  private readonly hiddenRoutes = [
    '/dashboard',
    '/recruiter/dashboard',
    '/admin',
    '/resume-builder',
    '/jobs'
  ];

  constructor() {
    // Check the real browser URL immediately — before Angular router initializes
    if (typeof window !== 'undefined') {
      this.showNavbar = !this.hiddenRoutes.some(r => window.location.pathname.startsWith(r));
    }

    // Keep in sync as the user navigates between pages
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.showNavbar = !this.hiddenRoutes.some(r => url.startsWith(r));
    });
  }
}

