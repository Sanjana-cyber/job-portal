import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="card animate-in">

        <!-- Success State -->
        <div *ngIf="success" class="state-block">
          <div class="icon-circle success-circle">✓</div>
          <h2>Password Reset!</h2>
          <p>Your password has been successfully updated. You can now log in with your new credentials.</p>
          <button class="btn-primary" (click)="router.navigate(['/login'])">Go to Login</button>
        </div>

        <!-- Form State -->
        <div *ngIf="!success">
          <div class="card-header">
            <div class="icon-circle">🔒</div>
            <h2>Reset Password</h2>
            <p>Enter your new password below.</p>
          </div>

          <div *ngIf="error" class="error-banner">
            <span>⚠</span> {{ error }}
          </div>

          <form (ngSubmit)="submit()">
            <div class="input-group">
              <input
                [type]="showPassword ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                placeholder="New password (min. 6 characters)"
                required
                class="auth-input"
              />
              <button type="button" class="toggle-btn" (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>

            <div class="input-group">
              <input
                [type]="showConfirm ? 'text' : 'password'"
                name="confirm"
                [(ngModel)]="confirmPassword"
                placeholder="Confirm new password"
                required
                class="auth-input"
              />
              <button type="button" class="toggle-btn" (click)="showConfirm = !showConfirm">
                {{ showConfirm ? '🙈' : '👁' }}
              </button>
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; background: #c0c0c0; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 20px; padding: 40px; width: 100%; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
    .animate-in { animation: scaleIn 0.3s ease; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    .card-header { text-align: center; margin-bottom: 28px; }
    .icon-circle { width: 60px; height: 60px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px; }
    .success-circle { background: #dcfce7; }
    h2 { margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #111; text-align: center; }
    p { margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center; }
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #ef4444; border-radius: 8px; padding: 10px 14px; color: #b91c1c; font-size: 13px; margin-bottom: 20px; display: flex; gap: 8px; align-items: center; }
    .input-group { position: relative; margin-bottom: 14px; display: flex; align-items: center; }
    .auth-input { width: 100%; padding: 12px 44px 12px 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
    .auth-input:focus { border-color: #111; }
    .toggle-btn { position: absolute; right: 12px; background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px; }
    .btn-primary { width: 100%; padding: 13px; background: #111; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: background 0.2s; font-family: inherit; }
    .btn-primary:hover:not(:disabled) { background: #333; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .state-block { text-align: center; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  token = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
  loading = false;
  error = '';
  success = false;

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  submit() {
    this.error = '';
    if (!this.password || !this.confirmPassword) { this.error = 'Please fill in all fields.'; return; }
    if (this.password.length < 6) { this.error = 'Password must be at least 6 characters.'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'Passwords do not match.'; return; }
    this.loading = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => { this.loading = false; this.success = true; },
      error: (err) => { this.loading = false; this.error = err.error?.message || 'Invalid or expired token. Please request a new link.'; }
    });
  }
}
