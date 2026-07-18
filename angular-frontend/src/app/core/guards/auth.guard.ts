import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * AuthGuard — Protects routes that require authentication.
 *
 * Fast path  : already authenticated → allow immediately (no HTTP call, no delay).
 * Wait path  : loading in progress   → wait until settled, then check.
 * Restore path: not loading, not auth → call loadCurrentUser() once, then check.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ── Fast path: already authenticated (e.g. navigating between protected pages) ──
  if (authService.isAuthenticated) {
    return of(true);
  }

  // ── Wait for loading to settle, then check / restore session ──
  return authService.loading$.pipe(
    filter(loading => !loading),   // wait until loading === false
    take(1),
    switchMap(() => {
      if (authService.isAuthenticated) {
        return of(true);
      }
      // Not authenticated after load completed — try one restore call
      return authService.loadCurrentUser().pipe(
        switchMap(() => {
          if (authService.isAuthenticated) {
            return of(true);
          }
          router.navigate(['/']);
          return of(false);
        })
      );
    })
  );
};
