import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationService } from '../../../../core/services/verification.service';

@Component({
  selector: 'app-verification-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verif-panel" *ngIf="verifRequired && verifStatus !== 'approved'">
      <div class="verif-header">
        <h3>Company Verification Required</h3>
        <p>You must verify your company details before you can post jobs.</p>
      </div>

      <div class="verif-status" [ngClass]="verifStatus">
        Current Status: <strong>{{ verifStatus | uppercase }}</strong>
      </div>

      <form *ngIf="verifStatus === 'none' || verifStatus === 'rejected'" (ngSubmit)="submit()" class="verif-form">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" [(ngModel)]="formData.companyName" name="companyName" required class="form-control" />
        </div>
        <div class="form-group">
          <label>Company Website</label>
          <input type="url" [(ngModel)]="formData.companyWebsite" name="companyWebsite" required class="form-control" />
        </div>
        <div class="form-group">
          <label>Tax ID / Registration Number</label>
          <input type="text" [(ngModel)]="formData.taxId" name="taxId" required class="form-control" />
        </div>
        <button type="submit" [disabled]="submitting" class="btn-submit">
          {{ submitting ? 'Submitting...' : 'Submit for Verification' }}
        </button>
      </form>
      
      <div *ngIf="verifStatus === 'pending'" class="verif-pending">
        Your application is currently under review by an administrator. You will be notified once approved.
      </div>
    </div>
  `,
  styles: [`
    .verif-panel { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .verif-header h3 { margin: 0 0 8px; color: var(--navy-900); }
    .verif-header p { margin: 0 0 16px; color: var(--text-secondary); font-size: 14px; }
    .verif-status { padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
    .verif-status.none { background: var(--cream-100); color: var(--navy-800); }
    .verif-status.pending { background: #fef3c7; color: #b45309; }
    .verif-status.rejected { background: #fee2e2; color: #b91c1c; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--navy-900); }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 8px; font-family: inherit; }
    .btn-submit { padding: 10px 20px; background: var(--navy-800); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .verif-pending { padding: 16px; background: var(--bg-page); border: 1px dashed var(--border-default); border-radius: 8px; color: var(--text-secondary); font-size: 14px; text-align: center; }
  `]
})
export class VerificationPanelComponent implements OnInit {
  verifService = inject(VerificationService);
  
  @Output() statusChange = new EventEmitter<any>();

  verifRequired = false;
  verifStatus = 'none';
  submitting = false;

  formData = {
    companyName: '',
    companyWebsite: '',
    taxId: ''
  };

  ngOnInit() {
    this.checkStatus();
  }

  checkStatus() {
    this.verifService.getVerificationStatus().subscribe({
      next: (res) => {
        this.verifRequired = res.data.verificationRequired;
        this.verifStatus = res.data.companyVerificationStatus;
        this.statusChange.emit(res.data);
      },
      error: (err) => console.error('Verification status fetch failed', err)
    });
  }

  submit() {
    if (!this.formData.companyName || !this.formData.companyWebsite || !this.formData.taxId) {
      alert('Please fill all fields');
      return;
    }
    this.submitting = true;
    this.verifService.submitVerification(this.formData).subscribe({
      next: () => {
        this.submitting = false;
        alert('Verification submitted successfully!');
        this.checkStatus();
      },
      error: (err) => {
        this.submitting = false;
        alert(err.error?.message || 'Submission failed');
      }
    });
  }
}
