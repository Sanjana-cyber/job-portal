import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job } from '../../../../core/services/job.service';
import { ApplicationService } from '../../../../core/services/application.service';

@Component({
  selector: 'app-manage-applications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>Applications</h2>
            <p class="subtitle">For: {{ job?.title }}</p>
          </div>
          <button class="btn-close" (click)="close()">×</button>
        </div>
        
        <div class="modal-body">
          <div *ngIf="loading" class="loading-state">Loading applications...</div>
          
          <div *ngIf="!loading && applications.length === 0" class="empty-state">
            <p>No applications yet for this job.</p>
          </div>

          <div *ngIf="!loading && applications.length > 0" class="app-list">
            <div class="app-card" *ngFor="let app of applications">
              <div class="app-info">
                <h4>{{ app.applicant?.name || 'Unknown User' }}</h4>
                <p>{{ app.applicant?.email }}</p>
                <div class="app-meta">
                  <span class="status-badge" [ngClass]="app.status">{{ app.status }}</span>
                  <span class="date">Applied: {{ app.createdAt | date:'shortDate' }}</span>
                </div>
              </div>
              
              <div class="app-actions">
                <a *ngIf="app.resume?.url" [href]="app.resume.url" target="_blank" class="btn-view-resume">View Resume</a>
                
                <div class="status-controls">
                  <select [value]="app.status" (change)="updateStatus(app._id, $event)" [disabled]="updatingId === app._id">
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span *ngIf="updatingId === app._id" class="updating-text">Saving...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
    .modal-content { background: var(--bg-surface); width: 100%; max-width: 700px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; border: 1px solid var(--border-subtle); }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-header h2 { margin: 0; font-size: 20px; color: var(--navy-900); font-family: var(--font-display); }
    .subtitle { margin: 4px 0 0; font-size: 14px; color: var(--text-secondary); }
    .btn-close { background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }
    .modal-body { padding: 24px; overflow-y: auto; }
    .loading-state, .empty-state { padding: 40px; text-align: center; color: var(--text-tertiary); }
    .app-list { display: flex; flex-direction: column; gap: 16px; }
    .app-card { display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid var(--border-default); border-radius: 12px; flex-wrap: wrap; gap: 16px; background: var(--bg-page); }
    .app-info h4 { margin: 0 0 4px; font-size: 16px; color: var(--navy-900); }
    .app-info p { margin: 0 0 8px; font-size: 14px; color: var(--text-secondary); }
    .app-meta { display: flex; gap: 12px; align-items: center; }
    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.reviewed { background: #e0f2fe; color: #0369a1; }
    .status-badge.shortlisted { background: #dcfce7; color: #15803d; }
    .status-badge.rejected { background: #fee2e2; color: #b91c1c; }
    .date { font-size: 12px; color: var(--text-tertiary); }
    .app-actions { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
    .btn-view-resume { font-size: 13px; font-weight: 600; color: var(--navy-600); text-decoration: none; }
    .btn-view-resume:hover { text-decoration: underline; }
    .status-controls { display: flex; align-items: center; gap: 8px; }
    select { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-default); font-family: inherit; font-size: 13px; }
    .updating-text { font-size: 12px; color: var(--text-tertiary); }
  `]
})
export class ManageApplicationsComponent implements OnInit {
  @Input() job: Job | null = null;
  @Output() closeModal = new EventEmitter<void>();

  appService = inject(ApplicationService);

  loading = true;
  applications: any[] = [];
  updatingId: string | null = null;

  ngOnInit() {
    if (this.job) {
      this.fetchApps();
    }
  }

  fetchApps() {
    this.loading = true;
    this.appService.getJobApplications(this.job!._id).subscribe({
      next: (res) => {
        this.applications = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  updateStatus(appId: string, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.updatingId = appId;
    
    this.appService.updateApplicationStatus(appId, status).subscribe({
      next: (res) => {
        this.updatingId = null;
        // update local state
        const app = this.applications.find(a => a._id === appId);
        if (app) {
          app.status = res.data.status;
        }
      },
      error: (err) => {
        console.error(err);
        this.updatingId = null;
        alert('Failed to update status');
      }
    });
  }

  close() {
    this.closeModal.emit();
  }
}
