import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { JobsComponent } from '../jobs/jobs/jobs.component';

/**
 * DashboardJobsComponent
 * Rendered at /dashboard/jobs (protected, jobseeker only).
 * Shows the exact same header as the main Dashboard, then
 * embeds the public <app-jobs> component below it.
 */
@Component({
  selector: 'app-dashboard-jobs',
  standalone: true,
  imports: [CommonModule, JobsComponent],
  templateUrl: './dashboard-jobs.component.html',
  styleUrl: './dashboard-jobs.component.css'
})
export class DashboardJobsComponent {
  public router = inject(Router);
  private authService = inject(AuthService);

  menuOpen = false;

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/']));
  }
}
