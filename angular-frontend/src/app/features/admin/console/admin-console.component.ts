import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VerificationService, AdminStats, RecruiterQueueItem } from '../../../core/services/verification.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-console.component.html',
  styleUrls: ['./admin-console.component.css']
})
export class AdminConsoleComponent implements OnInit {
  authService = inject(AuthService);
  verifService = inject(VerificationService);
  router = inject(Router);

  user = this.authService.currentUser;

  stats: AdminStats = { pending: 0, approved: 0, rejected: 0, total: 0, verificationRequired: false };
  queue: RecruiterQueueItem[] = [];
  filtered: RecruiterQueueItem[] = [];

  search = '';
  filterStatus = 'all';
  loading = true;
  toggling = false;

  // Reject modal
  rejectModal: { id: string; name: string } | null = null;
  rejectNote = '';
  rejecting = false;

  readonly statusLabel: Record<string, string> = {
    none: 'Not Submitted',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  readonly statusColor: Record<string, string> = {
    none: '#6b7280',
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444'
  };

  ngOnInit() {
    this.fetchAll();
  }

  fetchAll() {
    this.loading = true;
    forkJoin([
      this.verifService.getAdminStats(),
      this.verifService.getVerificationQueue()
    ]).subscribe({
      next: ([statsRes, queueRes]) => {
        this.stats = statsRes.data;
        this.queue = queueRes.data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load admin data', err);
        this.loading = false;
      }
    });
  }

  applyFilter() {
    let data = [...this.queue];
    if (this.filterStatus !== 'all') {
      data = data.filter(r => r.companyVerificationStatus === this.filterStatus);
    }
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      data = data.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.companyName?.toLowerCase().includes(q)
      );
    }
    this.filtered = data;
  }

  handleToggle() {
    this.toggling = true;
    const newVal = !this.stats.verificationRequired;
    this.verifService.updateVerificationSettings({ verificationRequired: newVal }).subscribe({
      next: () => {
        this.stats.verificationRequired = newVal;
        this.toggling = false;
      },
      error: () => { this.toggling = false; }
    });
  }

  handleApprove(id: string, name: string) {
    this.verifService.approveRecruiter(id).subscribe({
      next: () => this.fetchAll(),
      error: (err) => alert(err.error?.message || 'Failed to approve')
    });
  }

  openReject(recruiter: RecruiterQueueItem) {
    this.rejectModal = { id: recruiter._id, name: recruiter.name };
    this.rejectNote = '';
  }

  handleReject() {
    if (!this.rejectNote.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    this.rejecting = true;
    this.verifService.rejectRecruiter(this.rejectModal!.id, { note: this.rejectNote }).subscribe({
      next: () => {
        this.rejecting = false;
        this.rejectModal = null;
        this.fetchAll();
      },
      error: (err) => {
        this.rejecting = false;
        alert(err.error?.message || 'Failed to reject');
      }
    });
  }

  handleDeleteRequest(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the verification request for ${name}? This will reset their verification status.`)) return;
    this.verifService.deleteVerificationRequest(id).subscribe({
      next: () => this.fetchAll(),
      error: (err) => alert(err.error?.message || 'Failed to delete request')
    });
  }

  getStatusColor(status: string): string {
    return this.statusColor[status] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    return this.statusLabel[status] || 'Unknown';
  }

  getNoteColor(note: string): string {
    if (note.includes('NOT FOUND')) return '#dc2626';
    if (note.includes('APPROVED')) return '#16a34a';
    if (note.includes('ERROR')) return '#d97706';
    return '#6b7280';
  }

  getNoteBackground(note: string): string {
    if (note.includes('NOT FOUND')) return '#fef2f2';
    if (note.includes('APPROVED')) return '#f0fdf4';
    if (note.includes('ERROR')) return '#fffbeb';
    return 'transparent';
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  getInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }
}
