import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService, Job } from '../../../../core/services/job.service';

@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ jobData ? 'Edit Job' : 'Post a New Job' }}</h2>
          <button class="btn-close" (click)="close()">×</button>
        </div>
        <form (ngSubmit)="submit()" class="job-form">
          <div class="form-row">
            <div class="form-group">
              <label>Job Title</label>
              <input type="text" [(ngModel)]="formData.title" name="title" required class="form-control" />
            </div>
            <div class="form-group">
              <label>Company Name</label>
              <input type="text" [(ngModel)]="formData.company" name="company" required class="form-control" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Location (Optional)</label>
              <input type="text" [(ngModel)]="formData.location" name="location" class="form-control" />
            </div>
            <div class="form-group">
              <label>Experience Required (e.g. 2+ Years)</label>
              <input type="text" [(ngModel)]="formData.experienceRequired" name="experienceRequired" class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label>Required Skills (comma separated)</label>
            <input type="text" [(ngModel)]="skillsString" name="skillsString" class="form-control" placeholder="React, Node.js, MongoDB" />
          </div>

          <div class="form-group">
            <label>Job Description</label>
            <textarea [(ngModel)]="formData.description" name="description" required rows="6" class="form-control"></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="close()">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="submitting">
              {{ submitting ? 'Saving...' : (jobData ? 'Update Job' : 'Post Job') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
    .modal-content { background: var(--bg-surface); width: 100%; max-width: 600px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; border: 1px solid var(--border-subtle); }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 20px; color: var(--navy-900); font-family: var(--font-display); }
    .btn-close { background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }
    .job-form { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--navy-900); }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 8px; font-family: inherit; box-sizing: border-box; }
    .modal-footer { margin-top: 8px; display: flex; justify-content: flex-end; gap: 12px; }
    .btn-cancel { padding: 10px 16px; background: transparent; border: 1px solid var(--border-default); border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-submit { padding: 10px 20px; background: var(--navy-800); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class JobFormComponent implements OnInit {
  @Input() jobData: Job | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  jobService = inject(JobService);

  submitting = false;
  skillsString = '';
  formData: any = {
    title: '',
    company: '',
    location: '',
    description: '',
    experienceRequired: '',
    requiredSkills: []
  };

  ngOnInit() {
    if (this.jobData) {
      this.formData = { ...this.jobData };
      this.skillsString = this.jobData.requiredSkills?.join(', ') || '';
    }
  }

  close() {
    this.closeModal.emit();
  }

  submit() {
    if (!this.formData.title || !this.formData.company || !this.formData.description) {
      alert('Title, Company, and Description are required.');
      return;
    }
    this.submitting = true;
    
    // Process skills
    this.formData.requiredSkills = this.skillsString
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    if (this.jobData?._id) {
      this.jobService.updateJob(this.jobData._id, this.formData).subscribe({
        next: () => {
          this.submitting = false;
          this.saved.emit();
        },
        error: (err) => {
          this.submitting = false;
          alert('Failed to update job');
          console.error(err);
        }
      });
    } else {
      this.jobService.createJob(this.formData).subscribe({
        next: () => {
          this.submitting = false;
          this.saved.emit();
        },
        error: (err) => {
          this.submitting = false;
          alert('Failed to post job');
          console.error(err);
        }
      });
    }
  }
}
