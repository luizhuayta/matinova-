import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { LocaleService } from './locale.service';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const locale = inject(LocaleService);
  const csrf = auth.csrfToken();
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
  let headers = req.headers;
  if (mutating && csrf) {
    headers = headers.set('X-CSRF-Token', csrf);
  }
  headers = headers.set('X-CMS-Locale', locale.locale());
  return next(req.clone({ withCredentials: true, headers }));
};
