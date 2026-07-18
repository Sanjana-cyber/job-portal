import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Global Error Interceptor — Handles HTTP errors centrally.
 *
 * This mirrors the error handling pattern in React's axios catch blocks.
 * Logs errors and passes them through for components to handle.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      // Extract the error message from the Express backend response
      const message = error.error?.message || error.message || 'An unexpected error occurred';

      // Log for debugging
      if (error.status === 0) {
        console.error('[Network Error] Could not reach backend:', req.url);
      } else if (error.status === 401) {
        console.warn('[Auth] Unauthorized request:', req.url);
      } else if (error.status >= 500) {
        console.error('[Server Error]', error.status, message);
      }

      return throwError(() => error);
    })
  );
};
