import { Routes } from '@angular/router';

/**
 * Application Routes
 *
 * Phase 1: Only auth routes live in Angular.
 * All other routes (dashboard, jobs, etc.) are handled by the React app.
 * After login/register, we use window.location.href to redirect back to React.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In — TalentBridge'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account — TalentBridge'
  },
  {
    // Public jobs page — the main "Find Jobs" feature for job seekers
    path: 'jobs',
    loadComponent: () =>
      import('./features/jobs/jobs/jobs.component').then(m => m.JobsComponent),
    title: 'Find Jobs — TalentBridge'
  },
  {
    // Public landing page
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'TalentBridge — Where Talent Meets Opportunity'
  },
  {
    // Catch-all: redirect unknown Angular routes to landing page
    path: '**',
    redirectTo: ''
  }
];
