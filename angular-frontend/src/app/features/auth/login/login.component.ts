import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

/**
 * Login Component — Angular equivalent of React's LoginPage.jsx
 *
 * Features:
 *   - Email/password login form (Reactive Forms)
 *   - Google OAuth via GSI script
 *   - Forgot password toggle
 *   - Loading state + error handling
 *   - Post-login redirect based on user role
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showForgotPassword = false;

  // Forgot password state
  forgotEmail = '';
  forgotLoading = false;
  forgotMessage = '';
  forgotError = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    this.initGoogleSignIn();
  }

  /** Initialize Google Sign-In button (same as React's GoogleLoginBtn) */
  private initGoogleSignIn(): void {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleSuccess(response.credential)
        });
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular'
          });
        }
      }
    };
    document.head.appendChild(script);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: (res) => {
        const dest = this.authService.getDashboardRoute(res.user.role);
        if (dest.isAngular) {
          this.router.navigate([dest.path]);
        } else {
          window.location.href = `${environment.reactAppUrl}${dest.path}`;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  handleGoogleSuccess(credential: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.googleLogin(credential, 'jobseeker').subscribe({
      next: (res) => {
        const dest = this.authService.getDashboardRoute(res.user.role);
        if (dest.isAngular) {
          this.router.navigate([dest.path]);
        } else {
          window.location.href = `${environment.reactAppUrl}${dest.path}`;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Google authentication failed.';
        this.isLoading = false;
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  showForgot(): void {
    this.showForgotPassword = true;
    this.forgotEmail = '';
    this.forgotMessage = '';
    this.forgotError = '';
  }

  hideForgot(): void {
    this.showForgotPassword = false;
  }

  submitForgotPassword(): void {
    if (!this.forgotEmail.trim()) {
      this.forgotError = 'Please enter your email address';
      return;
    }
    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotMessage = '';

    this.authService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: (res) => {
        this.forgotMessage = res.message;
        this.forgotLoading = false;
      },
      error: (err) => {
        this.forgotError = err.error?.message || 'Failed to send reset email.';
        this.forgotLoading = false;
      }
    });
  }
}
