import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="card animate-in">

        <!-- Verifying -->
        <div *ngIf="status === 'verifying'" class="state-block">
          <div class="spinner"></div>
          <h2>Verifying Email</h2>
          <p>Please wait while we verify your email address...</p>
        </div>

        <!-- Success -->
        <div *ngIf="status === 'success'" class="state-block">
          <div class="icon-circle success-circle">✓</div>
          <h2>Verification Successful!</h2>
          <p>Your email address has been verified. You can now access all portal features.</p>
          <button class="btn-primary" (click)="router.navigate(['/login'])">Go to Login</button>
        </div>

        <!-- Error -->
        <div *ngIf="status === 'error'" class="state-block">
          <div class="icon-circle error-circle">✕</div>
          <h2>Verification Failed</h2>
          <p class="error-text">{{ errorMsg }}</p>
          <p>The verification link may be invalid or has expired.</p>
          <button class="btn-primary" (click)="router.navigate(['/'])">Go to Home</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; background: #c0c0c0; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
    .animate-in { animation: scaleIn 0.3s ease; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    .state-block { text-align: center; }
    .icon-circle { width: 68px; height: 68px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; margin: 0 auto 20px; }
    .success-circle { background: #dcfce7; color: #15803d; }
    .error-circle { background: #fee2e2; color: #b91c1c; }
    .spinner { width: 52px; height: 52px; border: 3px solid #e5e7eb; border-top-color: #111; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #111; }
    p { margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6; }
    .error-text { color: #b91c1c; font-weight: 500; }
    .btn-primary { display: inline-block; padding: 12px 28px; background: #111; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: inherit; }
    .btn-primary:hover { background: #333; }
  `]
})
export class VerifyEmailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  http = inject(HttpClient);

  status: 'verifying' | 'success' | 'error' = 'verifying';
  errorMsg = '';

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.status = 'error';
      this.errorMsg = 'No verification token provided.';
      return;
    }
    this.http.get<any>(`${environment.apiUrl}/auth/verify-email/${token}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.status = 'success';
        } else {
          this.status = 'error';
          this.errorMsg = res.message || 'Failed to verify email.';
        }
      },
      error: (err) => {
        this.status = 'error';
        this.errorMsg = err.error?.message || 'Invalid or expired verification token.';
      }
    });
  }
}
