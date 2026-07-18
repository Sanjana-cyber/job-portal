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
              <div class="app-top-row">
                <div class="app-info">
                  <h4>{{ app.applicant?.name || 'Unknown User' }}</h4>
                  <p>{{ app.applicant?.email }}</p>
                  <div class="app-meta">
                    <span class="status-badge" [ngClass]="app.status">{{ app.status | titlecase }}</span>
                    <span class="date">Applied: {{ app.createdAt | date:'mediumDate' }}</span>
                    <span *ngIf="app.atsScore !== null && app.atsScore !== undefined" class="ats-score">
                      🎯 ATS Score: <strong>{{ app.atsScore }}%</strong>
                    </span>
                  </div>
                </div>

                <div class="app-actions">
                  <div class="resume-buttons" *ngIf="app.resume?.fileUrl">
                    <a [href]="app.resume.fileUrl"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="btn-view-resume">
                      📄 View
                    </a>
                    <a [href]="app.resume.fileUrl"
                       download
                       target="_blank"
                       class="btn-download-resume">
                      ⬇ Download
                    </a>
                  </div>
                  <span *ngIf="!app.resume?.fileUrl" class="no-resume">No resume uploaded</span>

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

              <!-- Cover Letter -->
              <div *ngIf="app.coverLetter" class="cover-letter">
                <p class="cover-label">Cover Letter:</p>
                <p class="cover-text">{{ app.coverLetter }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
    .modal-content { background: #fff; width: 100%; max-width: 760px; border-radius: 16px; box-shadow: 0 24px 48px rgba(0,0,0,0.18); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; border: 1px solid #e5e7eb; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: flex-start; background: #fafafa; }
    .modal-header h2 { margin: 0; font-size: 20px; color: #111; font-weight: 700; }
    .subtitle { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
    .btn-close { background: transparent; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; }
    .modal-body { padding: 24px; overflow-y: auto; }
    .loading-state, .empty-state { padding: 40px; text-align: center; color: #9ca3af; }
    .app-list { display: flex; flex-direction: column; gap: 16px; }
    .app-card { padding: 18px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fef9f7; transition: all 0.3s ease; }
    .app-top-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
    .app-info h4 { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #111; }
    .app-info p { margin: 0 0 8px; font-size: 14px; color: #6b7280; }
    .app-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.reviewed { background: #e0f2fe; color: #0369a1; }
    .status-badge.shortlisted { background: #dcfce7; color: #15803d; box-shadow: 0 0 8px rgba(21,128,61,0.2); }
    .status-badge.rejected { background: #fee2e2; color: #b91c1c; }
    .date { font-size: 12px; color: #9ca3af; }
    .ats-score { font-size: 12px; color: #374151; background: #f3f4f6; padding: 2px 8px; border-radius: 20px; }
    .ats-score strong { color: #166534; }
    .app-actions { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; flex-shrink: 0; }
    .resume-buttons { display: flex; gap: 8px; }
    .btn-view-resume, .btn-download-resume { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.2s; white-space: nowrap; }
    .btn-view-resume { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .btn-view-resume:hover { background: #e5e7eb; }
    .btn-download-resume { background: #111; color: #fff; }
    .btn-download-resume:hover { background: #333; }
    .no-resume { font-size: 12px; color: #9ca3af; font-style: italic; }
    .status-controls { display: flex; align-items: center; gap: 8px; }
    select { padding: 8px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-family: inherit; font-size: 13px; background: #fff; font-weight: 600; cursor: pointer; }
    select:focus { border-color: #111; outline: none; }
    .updating-text { font-size: 12px; color: #9ca3af; }
    .cover-letter { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f0f0; }
    .cover-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 4px; }
    .cover-text { font-size: 14px; color: #374151; margin: 0; line-height: 1.6; }
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
