import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ok = await auth.ensureSession();
  return ok ? true : router.createUrlTree(['/admin/login']);
};

export const adminGuestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ok = await auth.ensureSession();
  return ok ? router.createUrlTree(['/admin']) : true;
};
