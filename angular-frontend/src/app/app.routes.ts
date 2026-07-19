import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    // Protected Find Jobs page inside dashboard shell
    path: 'dashboard/jobs',
    loadComponent: () =>
      import('./features/dashboard/dashboard-jobs.component').then(m => m.DashboardJobsComponent),
    canActivate: [authGuard],
    title: 'Find Jobs — TalentBridge'
  },
  {
    // Protected Job Seeker Dashboard
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    pathMatch: 'full',
    title: 'Dashboard — TalentBridge'
  },
  {
    // Public jobs page — the main "Find Jobs" feature for job seekers
    path: 'jobs',
    loadComponent: () =>
      import('./features/jobs/jobs/jobs.component').then(m => m.JobsComponent),
    title: 'Find Jobs — TalentBridge'
  },
  {
    // Resume Builder Tool
    path: 'resume-builder',
    loadComponent: () =>
      import('./features/resume-builder/resume-builder.component').then(m => m.ResumeBuilderComponent),
    title: 'Build Resume — TalentBridge'
  },
  {
    // Protected Recruiter Dashboard
    path: 'recruiter/dashboard',
    loadComponent: () =>
      import('./features/recruiter/dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent),
    canActivate: [authGuard],
    title: 'Recruiter Dashboard — TalentBridge'
  },
  {
    // Public landing page
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'TalentBridge — Where Talent Meets Opportunity'
  },
  {
    // Admin Login page (no guard — accessible to anyone)
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/admin-login.component').then(m => m.AdminLoginComponent),
    title: 'Admin Login — TalentBridge'
  },
  {
    // Protected Admin Console — admin role required
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/console/admin-console.component').then(m => m.AdminConsoleComponent),
    canActivate: [adminGuard],
    title: 'System Management Console — TalentBridge'
  },
  {
    // Reset Password (link from email)
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Reset Password — TalentBridge'
  },
  {
    // Email Verification (link from email)
    path: 'verify-email/:token',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    title: 'Verify Email — TalentBridge'
  },
  {
    // Profile Builder — jobseeker profile editing
    path: 'dashboard/profile',
    loadComponent: () =>
      import('./features/dashboard/profile-builder/profile-builder.component').then(m => m.ProfileBuilderComponent),
    canActivate: [authGuard],
    title: 'Profile Builder — TalentBridge'
  },
  {
    // Catch-all: redirect unknown Angular routes to landing page
    path: '**',
    redirectTo: ''
  }
];
