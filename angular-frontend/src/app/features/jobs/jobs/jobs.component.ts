import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobService, Job } from '../../../core/services/job.service';
import { ApplicationService, AtsData } from '../../../core/services/application.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../shared/services/auth-modal.service';
import { environment } from '../../../../environments/environment';

/**
 * JobsComponent — Angular equivalent of React's JobsPage.jsx
 *
 * Features mirrored exactly:
 *  - Public job browsing (no auth needed)
 *  - Search by title / company / skills
 *  - Auth-gate modal for unauthenticated users (redirects to Angular /register)
 *  - Apply modal for authenticated jobseekers
 *  - ATS match score preview before submitting application
 *  - Role-aware apply button (disabled for recruiters/admins)
 */
@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css'
})
export class JobsComponent implements OnInit {
  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private modalService = inject(AuthModalService);
  private router = inject(Router);

  // ── State (mirrors React useState) ──
  jobs: Job[] = [];
  loading = true;
  search = '';
  errorMessage = '';

  // Apply flow (authenticated jobseeker)
  applyingTo: Job | null = null;
  coverLetter = '';
  atsData: AtsData | null = null;
  fetchingAts = false;
  submittingApplication = false;
  applySuccess = false;
  applyError = '';

  // Auth-gate flow (unauthenticated user)
  authGateJob: Job | null = null;

  // Toast-like notifications
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;

  get user() { return this.authService.currentUser; }

  ngOnInit(): void {
    // Jobs is a public endpoint — no auth needed. Fetch immediately.
    // User state is already populated by APP_INITIALIZER, no loadCurrentUser() needed here.
    this.fetchJobs();
  }

  fetchJobs(query = ''): void {
    this.loading = true;
    this.errorMessage = '';
    this.jobService.getJobs(query).subscribe({
      next: (res) => {
        this.jobs = res.data;
        this.loading = false;
      },
      error: () => {
        this.showToast('Failed to load jobs', 'error');
        this.loading = false;
      }
    });
  }

  handleSearch(): void {
    this.fetchJobs(this.search);
  }

  /**
   * Central "Apply Now" handler — branches by auth state.
   * Mirrors React's handleApplyClick exactly.
   */
  handleApplyClick(job: Job): void {
    if (!this.user) {
      // Unauthenticated: show auth gate
      this.authGateJob = job;
    } else if (this.user.role === 'jobseeker') {
      // Authenticated jobseeker: open apply modal + fetch ATS
      this.applyingTo = job;
      this.coverLetter = '';
      this.atsData = null;
      this.applyError = '';
      this.applySuccess = false;
      this.fetchAtsScore(job);
    } else {
      // Recruiter/admin: show error toast
      this.showToast('Only job seekers can apply for jobs.', 'error');
    }
  }

  private fetchAtsScore(job: Job): void {
    this.fetchingAts = true;
    this.profileService.getResumes().subscribe({
      next: (resumesRes) => {
        const activeResume = resumesRes.data.find(r => r.isActive);
        if (activeResume) {
          const jdText = job.description ? `${job.title} ${job.description}` : job.title;
          this.applicationService.matchATS(activeResume._id, jdText).subscribe({
            next: (matchRes) => {
              this.atsData = matchRes.data;
              this.fetchingAts = false;
            },
            error: () => { this.fetchingAts = false; }
          });
        } else {
          this.fetchingAts = false;
        }
      },
      error: () => { this.fetchingAts = false; }
    });
  }

  handleApply(): void {
    if (!this.applyingTo) return;
    this.submittingApplication = true;
    this.applyError = '';

    this.applicationService.applyToJob(this.applyingTo._id, this.coverLetter).subscribe({
      next: () => {
        this.applySuccess = true;
        this.submittingApplication = false;
        this.showToast('Application submitted successfully!', 'success');
        setTimeout(() => this.closeApplyModal(), 1800);
      },
      error: (err) => {
        this.applyError = err.error?.message || 'Failed to apply. Please try again.';
        this.submittingApplication = false;
      }
    });
  }

  closeApplyModal(): void {
    this.applyingTo = null;
    this.coverLetter = '';
    this.atsData = null;
    this.applySuccess = false;
    this.applyError = '';
  }

  closeAuthGate(): void {
    this.authGateJob = null;
  }

  /** Redirect unauthenticated user to Angular register page */
  goToRegister(): void {
    this.authGateJob = null;
    this.modalService.open('register');
  }

  /** Redirect to login */
  goToLogin(): void {
    this.authGateJob = null;
    this.modalService.open('login');
  }

  getAtsScoreColor(score: number): string {
    if (score >= 80) return 'var(--success-500)';
    if (score >= 60) return 'var(--warning-500, #d97706)';
    return 'var(--error-500)';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
