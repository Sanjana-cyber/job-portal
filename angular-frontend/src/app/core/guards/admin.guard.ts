import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * AdminGuard — Protects routes that require admin role.
 * Redirects to /admin/login if not authenticated or not an admin.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const checkAdmin = () => {
    if (authService.isAuthenticated && authService.currentUser?.role === 'admin') {
      return of(true);
    }
    router.navigate(['/admin/login']);
    return of(false);
  };

  // Fast path: already authenticated
  if (authService.isAuthenticated) {
    return checkAdmin();
  }

  return authService.loading$.pipe(
    filter(loading => !loading),
    take(1),
    switchMap(() => {
      if (authService.isAuthenticated) {
        return checkAdmin();
      }
      return authService.loadCurrentUser().pipe(
        switchMap(() => checkAdmin())
      );
    })
  );
};
