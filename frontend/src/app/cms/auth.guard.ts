import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, adminReturnUrl } from './auth.service';

export const adminAuthGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ok = await auth.ensureSession();
  return ok ? true : router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};

export const adminGuestGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ok = await auth.ensureSession();
  return ok ? router.parseUrl(adminReturnUrl(route.queryParamMap.get('returnUrl'))) : true;
};
