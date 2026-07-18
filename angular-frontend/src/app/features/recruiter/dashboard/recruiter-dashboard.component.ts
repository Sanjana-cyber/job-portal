import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { JobService, Job } from '../../../core/services/job.service';
import { VerificationPanelComponent } from '../components/verification-panel/verification-panel.component';
import { JobFormComponent } from '../components/job-form/job-form.component';
import { ManageApplicationsComponent } from '../components/manage-applications/manage-applications.component';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    VerificationPanelComponent,
    JobFormComponent,
    ManageApplicationsComponent
  ],
  templateUrl: './recruiter-dashboard.component.html',
  styleUrls: ['./recruiter-dashboard.component.css']
})
export class RecruiterDashboardComponent implements OnInit {
  authService = inject(AuthService);
  jobService = inject(JobService);
  router = inject(Router);

  user = this.authService.currentUser;
  jobs: Job[] = [];
  loading = true;

  verifStatus = 'none';
  verifRequired = false;

  isJobFormOpen = false;
  editingJob: Job | null = null;
  
  isAppsOpen = false;
  selectedJobForApps: Job | null = null;

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.loading = true;
    this.jobService.getMyJobs().subscribe({
      next: (res) => {
        this.jobs = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load jobs', err);
        this.loading = false;
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  handleVerifStatusChange(data: any) {
    this.verifStatus = data.companyVerificationStatus;
    this.verifRequired = data.verificationRequired;
  }

  get canPost(): boolean {
    return !this.verifRequired || this.verifStatus === 'approved';
  }

  openCreateJob() {
    if (this.verifRequired && this.verifStatus !== 'approved') {
      alert('Company verification required. Please submit your company details below.');
      return;
    }
    this.editingJob = null;
    this.isJobFormOpen = true;
  }

  openEditJob(job: Job) {
    this.editingJob = job;
    this.isJobFormOpen = true;
  }

  openManageApps(job: Job) {
    this.selectedJobForApps = job;
    this.isAppsOpen = true;
  }

  handleDeleteJob(id: string) {
    if (confirm('Are you sure you want to delete this job? All applications will also be deleted.')) {
      this.jobService.deleteJob(id).subscribe({
        next: () => {
          this.fetchJobs();
        },
        error: (err) => {
          console.error('Failed to delete job', err);
        }
      });
    }
  }

  onJobFormClosed() {
    this.isJobFormOpen = false;
    this.editingJob = null;
  }

  onJobSaved() {
    this.isJobFormOpen = false;
    this.editingJob = null;
    this.fetchJobs();
  }

  onAppsClosed() {
    this.isAppsOpen = false;
    this.selectedJobForApps = null;
  }
}
