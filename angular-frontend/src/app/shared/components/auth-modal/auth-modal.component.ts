import {
  Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService, AuthModalState, AuthModalTab } from '../../services/auth-modal.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

/**
 * AuthModalComponent
 *
 * A full-featured inline dialog with Login / Register tabs.
 * Triggered by AuthModalService.open(). Sits in AppComponent's template
 * so it is available on every page without routing.
 *
 * Features:
 *   - Animated tab switcher (Login ↔ Register)
 *   - Login: email/password + forgot-password flow + Google OAuth
 *   - Register: multi-role (jobseeker/recruiter) + Google OAuth
 *   - Closes on backdrop click or × button
 *   - On success: jobseeker → /dashboard, recruiter/admin → React
 */
@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.css'
})
export class AuthModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb            = inject(FormBuilder);
  private authService   = inject(AuthService);
  private modalService  = inject(AuthModalService);
  private router        = inject(Router);

  @ViewChild('loginGoogleBtn')    loginGoogleBtnRef!:    ElementRef;
  @ViewChild('registerGoogleBtn') registerGoogleBtnRef!: ElementRef;

  // ── Modal State ──
  state: AuthModalState = { open: false, tab: 'login' };
  private subs = new Subscription();
  private googleScriptLoaded = false;

  // ── Login State ──
  loginLoading       = false;
  loginError         = '';
  showLoginPassword  = false;
  showForgot         = false;
  forgotEmail        = '';
  forgotLoading      = false;
  forgotMessage      = '';
  forgotError        = '';

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  // ── Register State ──
  registerLoading    = false;
  registerError      = '';
  showRegPwd         = false;
  showRegConfirmPwd  = false;

  registerForm = this.fb.group({
    name:            ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    role:            ['jobseeker', Validators.required],
    companyName:     [''],
    companyWebsite:  [''],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  get isRecruiter(): boolean {
    return this.registerForm.get('role')?.value === 'recruiter';
  }

  passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
    const pw  = ctrl.get('password');
    const cpw = ctrl.get('confirmPassword');
    if (pw && cpw && pw.value !== cpw.value) {
      cpw.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  hasRegError(field: string, error: string): boolean {
    const c = this.registerForm.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }

  // ── Tab indicator position ──
  get tabTranslate(): string {
    return this.state.tab === 'register' ? 'translateX(100%)' : 'translateX(0)';
  }

  ngOnInit(): void {
    // Subscribe to modal open/close/tab changes
    this.subs.add(
      this.modalService.state.subscribe(s => {
        const wasOpen = this.state.open;
        this.state = s;

        if (s.open && !wasOpen) {
          // Reset forms when freshly opened
          this.resetForms();
          // Pre-fill role if provided
          if (s.role) {
            this.registerForm.patchValue({ role: s.role });
          }
          // Prevent body scroll
          document.body.style.overflow = 'hidden';
        }

        if (!s.open && wasOpen) {
          document.body.style.overflow = '';
        }

        // Re-render Google button after tab change (needs container in DOM)
        if (s.open) {
          setTimeout(() => this.renderGoogleButtons(), 50);
        }
      })
    );

    // Role watcher for recruiter fields
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      const cn = this.registerForm.get('companyName');
      if (role === 'recruiter') {
        cn?.setValidators(Validators.required);
      } else {
        cn?.clearValidators();
      }
      cn?.updateValueAndValidity();
    });
  }

  ngAfterViewInit(): void {
    this.loadGoogleScript();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    document.body.style.overflow = '';
  }

  // ── Google Script ──
  private loadGoogleScript(): void {
    if (this.googleScriptLoaded || document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      this.googleScriptLoaded = true;
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      this.googleScriptLoaded = true;
      this.renderGoogleButtons();
    };
    document.head.appendChild(s);
  }

  private renderGoogleButtons(): void {
    if (typeof google === 'undefined' || !this.state.open) return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleSuccess(response.credential)
    });

    const loginBtn = document.getElementById('modal-google-login-btn');
    if (loginBtn && this.state.tab === 'login') {
      loginBtn.innerHTML = '';
      google.accounts.id.renderButton(loginBtn, {
        theme: 'outline', size: 'large', width: '100%',
        text: 'signin_with', shape: 'rectangular'
      });
    }

    const regBtn = document.getElementById('modal-google-register-btn');
    if (regBtn && this.state.tab === 'register') {
      regBtn.innerHTML = '';
      google.accounts.id.renderButton(regBtn, {
        theme: 'outline', size: 'large', width: '100%',
        text: 'signup_with', shape: 'rectangular'
      });
    }
  }

  // ── Public ──
  close(): void   { this.modalService.close(); }
  switchTab(tab: AuthModalTab): void {
    this.modalService.switchTab(tab);
    setTimeout(() => this.renderGoogleButtons(), 80);
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  // ── Login ──
  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loginLoading = true;
    this.loginError   = '';
    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: res  => this.handleSuccess(res.user.role),
      error: err => {
        this.loginError   = err.error?.message || 'Login failed. Please try again.';
        this.loginLoading = false;
      }
    });
  }

  submitForgotPassword(): void {
    if (!this.forgotEmail.trim()) { this.forgotError = 'Please enter your email.'; return; }
    this.forgotLoading = true;
    this.forgotError   = '';
    this.forgotMessage = '';
    this.authService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: res  => { this.forgotMessage = res.message; this.forgotLoading = false; },
      error: err => {
        this.forgotError   = err.error?.message || 'Failed to send reset email.';
        this.forgotLoading = false;
      }
    });
  }

  showForgotView():   void { this.showForgot = true;  this.forgotEmail = ''; this.forgotMessage = ''; this.forgotError = ''; }
  hideForgotView():   void { this.showForgot = false; }
  toggleLoginPwd():   void { this.showLoginPassword = !this.showLoginPassword; }
  toggleRegPwd():     void { this.showRegPwd = !this.showRegPwd; }
  toggleRegConfirm(): void { this.showRegConfirmPwd = !this.showRegConfirmPwd; }

  // ── Register ──
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.registerLoading = true;
    this.registerError   = '';
    const v = this.registerForm.value;
    const payload: any = {
      name:     v.name!.trim(),
      email:    v.email!.trim(),
      password: v.password!,
      role:     v.role!
    };
    if (v.role === 'recruiter') {
      payload.companyName    = v.companyName?.trim();
      payload.companyWebsite = v.companyWebsite?.trim();
    }
    this.authService.register(payload).subscribe({
      next: res  => this.handleSuccess(res.user.role),
      error: err => {
        this.registerError   = err.error?.message || 'Registration failed.';
        this.registerLoading = false;
      }
    });
  }

  // ── Google OAuth (shared) ──
  handleGoogleSuccess(credential: string): void {
    const role = this.state.tab === 'register'
      ? (this.registerForm.get('role')?.value || 'jobseeker')
      : 'jobseeker';
    this.loginLoading    = true;
    this.registerLoading = true;
    this.authService.googleLogin(credential, role).subscribe({
      next: res  => this.handleSuccess(res.user.role),
      error: err => {
        const msg = err.error?.message || 'Google authentication failed.';
        this.loginError      = msg;
        this.registerError   = msg;
        this.loginLoading    = false;
        this.registerLoading = false;
      }
    });
  }

  // ── Post-auth redirect ──
  private handleSuccess(role: string): void {
    this.close();
    const dest = this.authService.getDashboardRoute(role);
    if (dest.isAngular) {
      this.router.navigate([dest.path]);
    } else {
      window.location.href = `${environment.reactAppUrl}${dest.path}`;
    }
  }

  private resetForms(): void {
    this.loginForm.reset();
    this.registerForm.reset({ role: 'jobseeker' });
    this.loginError = '';
    this.registerError = '';
    this.loginLoading  = false;
    this.registerLoading = false;
    this.showForgot    = false;
    this.showLoginPassword = false;
    this.showRegPwd    = false;
    this.showRegConfirmPwd = false;
  }
}
