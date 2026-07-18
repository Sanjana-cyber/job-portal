import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, tap } from 'rxjs';

/**
 * Auth Guard — Angular equivalent of React's <ProtectedRoute> component.
 *
 * Usage in routes:
 *   { path: 'dashboard', canActivate: [authGuard] }
 *
 * For role-based protection (like React's allowedRoles prop):
 *   { path: 'admin', canActivate: [roleGuard('admin')] }
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    tap(isAuth => {
      if (!isAuth) {
        router.navigate(['/login']);
      }
    })
  );
};

/**
 * Role Guard Factory — Restricts routes to specific roles.
 * Mirrors React's <ProtectedRoute allowedRoles={['recruiter']}>
 */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          router.navigate(['/login']);
          return false;
        }
        if (!allowedRoles.includes(user.role)) {
          router.navigate(['/']);
          return false;
        }
        return true;
      })
    );
  };
}
