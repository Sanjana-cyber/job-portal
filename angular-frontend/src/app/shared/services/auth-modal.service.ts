import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthModalTab = 'login' | 'register';

export interface AuthModalState {
  open: boolean;
  tab: AuthModalTab;
  /** Optional: pre-set role for recruiter sign-up flow */
  role?: 'jobseeker' | 'recruiter';
}

/**
 * AuthModalService — lightweight singleton that controls the global auth dialog.
 * Components inject this and call open() / close().
 */
@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private state$ = new BehaviorSubject<AuthModalState>({ open: false, tab: 'login' });

  readonly state = this.state$.asObservable();

  open(tab: AuthModalTab = 'login', role?: 'jobseeker' | 'recruiter'): void {
    this.state$.next({ open: true, tab, role });
  }

  close(): void {
    this.state$.next({ ...this.state$.value, open: false });
  }

  switchTab(tab: AuthModalTab): void {
    this.state$.next({ ...this.state$.value, tab });
  }
}
