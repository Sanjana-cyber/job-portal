import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

/**
 * Register Component — Angular equivalent of React's RegisterPage.jsx
 *
 * Features:
 *   - Multi-role registration (jobseeker / recruiter)
 *   - Conditional recruiter company fields
 *   - Password confirmation with custom validator
 *   - Google OAuth registration
 *   - Loading state + field-level error display
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['jobseeker', Validators.required],
    companyName: [''],
    companyWebsite: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  get isRecruiter(): boolean {
    return this.registerForm.get('role')?.value === 'recruiter';
  }

  /** Custom validator: confirmPassword must match password */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.initGoogleSignIn();

    // Dynamically require companyName when role is recruiter
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      const companyName = this.registerForm.get('companyName');
      if (role === 'recruiter') {
        companyName?.setValidators(Validators.required);
      } else {
        companyName?.clearValidators();
      }
      companyName?.updateValueAndValidity();
    });
  }

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
        const btnContainer = document.getElementById('google-signup-btn');
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signup_with',
            shape: 'rectangular'
          });
        }
      }
    };
    document.head.appendChild(script);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.registerForm.value;
    const payload: any = {
      name: formValue.name!.trim(),
      email: formValue.email!.trim(),
      password: formValue.password!,
      role: formValue.role!
    };

    // Include recruiter fields only if role is recruiter
    if (formValue.role === 'recruiter') {
      payload.companyName = formValue.companyName?.trim();
      payload.companyWebsite = formValue.companyWebsite?.trim();
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        const dest = this.authService.getDashboardRoute(res.user.role);
        this.router.navigate([dest.path]);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  handleGoogleSuccess(credential: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    const role = this.registerForm.get('role')?.value || 'jobseeker';
    this.authService.googleLogin(credential, role).subscribe({
      next: (res) => {
        const dest = this.authService.getDashboardRoute(res.user.role);
        this.router.navigate([dest.path]);
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

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /** Helper to check if a field has an error and has been touched */
  hasError(field: string, error: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }
}
