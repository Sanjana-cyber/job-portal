import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor — Ensures httpOnly cookies are sent with every request.
 *
 * This is the Angular equivalent of Axios's `withCredentials: true`
 * from React's authApi.js.
 *
 * Because the backend stores JWT in an httpOnly cookie (not localStorage),
 * we simply need to tell the browser to include cookies in cross-origin requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const clonedRequest = req.clone({
    withCredentials: true
  });
  return next(clonedRequest);
};
