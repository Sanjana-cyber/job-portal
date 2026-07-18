import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, MeResponse, MessageResponse } from '../models/auth.model';

/**
 * AuthService — Angular equivalent of React's AuthContext.
 *
 * Maps 1:1 to the React auth flow:
 *   React AuthContext.login()        → AuthService.login()
 *   React AuthContext.register()     → AuthService.register()
 *   React AuthContext.logout()       → AuthService.logout()
 *   React AuthContext.googleLogin()  → AuthService.googleLogin()
 *   React AuthContext.loadUser()     → AuthService.loadCurrentUser()
 *
 * The backend stores JWT in an httpOnly cookie, so we just need
 * withCredentials: true (handled by the AuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ── Reactive State (replaces React's useState + useContext) ──
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  /** Observable streams for components to subscribe to */
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /** Snapshot getters */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // ── API Methods (mirror React's authApi.js) ──

  /**
   * Login with email & password.
   * POST /api/auth/login  { email, password }
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.success) {
          this.currentUserSubject.next(res.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Register a new user.
   * POST /api/auth/register  { name, email, password, role, companyName?, companyWebsite? }
   */
  register(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    companyName?: string;
    companyWebsite?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => {
        if (res.success) {
          this.currentUserSubject.next(res.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Google OAuth login/register.
   * POST /api/auth/google  { credential, role }
   */
  googleLogin(credential: string, role: string = 'jobseeker'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, { credential, role }).pipe(
      tap(res => {
        if (res.success) {
          this.currentUserSubject.next(res.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Logout — clears the httpOnly cookie on the backend.
   * POST /api/auth/logout
   */
  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }),
      catchError(() => {
        // Clear local state even if API call fails (same as React)
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return of({ success: true, message: 'Logged out' } as MessageResponse);
      })
    );
  }

  /**
   * Load current user session (called on app init).
   * GET /api/auth/me
   * Equivalent of React's loadUser() in useEffect.
   */
  loadCurrentUser(): Observable<MeResponse | null> {
    this.loadingSubject.next(true);
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap(res => {
        if (res.success) {
          this.currentUserSubject.next(res.user);
          this.isAuthenticatedSubject.next(true);
        }
        this.loadingSubject.next(false);
      }),
      catchError(() => {
        // Not authenticated — expected on first visit
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.loadingSubject.next(false);
        return of(null);
      })
    );
  }

  /**
   * Forgot password — sends reset email.
   * POST /api/auth/forgot-password  { email }
   */
  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * Reset password using token.
   * POST /api/auth/reset-password  { token, password }
   */
  resetPassword(token: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/reset-password`, { token, password });
  }

  /**
   * Helper: returns the post-login destination.
   * jobseeker → stays in Angular (navigates to /jobs)
   * recruiter/admin → goes back to React app (use window.location.href)
   */
  getDashboardRoute(role: string): { isAngular: boolean; path: string } {
    if (role === 'jobseeker') {
      return { isAngular: true, path: '/dashboard' };
    }
    const reactRoutes: Record<string, string> = {
      recruiter: '/recruiter/dashboard',
      admin: '/admin'
    };
    return { isAngular: false, path: reactRoutes[role] || '/' };
  }
}
