import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';

/**
 * App Config — Angular's equivalent of React's main.jsx provider setup.
 *
 * APP_INITIALIZER ensures the auth session is restored from the cookie
 * BEFORE any route guard (authGuard) evaluates. This guarantees that
 * navigating between /dashboard and /dashboard/jobs works correctly
 * because isAuthenticated is already true when the guard fires.
 */
function initAuth(authService: AuthService): () => Promise<void> {
  return () => new Promise<void>(resolve => {
    authService.loadCurrentUser().subscribe({
      next: () => resolve(),
      error: () => resolve()  // Guests are fine — resolve either way
    });
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true
    }
  ]
};
