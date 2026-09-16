import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './cms.models';

export type AdminRole = 'admin' | 'editor' | '';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly username = signal<string | null>(null);
  readonly role = signal<AdminRole>('');
  readonly csrfToken = signal('');
  readonly ready = signal(false);

  isAdmin(): boolean {
    return this.role() === 'admin';
  }

  async ensureSession(): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ authenticated: boolean; username?: string; role?: string; csrfToken?: string }>(
          `${API_URL}/auth/me`
        )
      );
      this.username.set(res.authenticated ? (res.username ?? 'admin') : null);
      this.role.set(res.authenticated ? ((res.role as AdminRole) || 'admin') : '');
      this.csrfToken.set(res.csrfToken ?? '');
      this.ready.set(true);
      return res.authenticated;
    } catch {
      this.username.set(null);
      this.role.set('');
      this.csrfToken.set('');
      this.ready.set(true);
      return false;
    }
  }

  async login(username: string, password: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ username: string; role?: string; csrfToken?: string }>(`${API_URL}/auth/login`, {
          username,
          password,
        })
      );
      this.username.set(res.username);
      this.role.set((res.role as AdminRole) || 'admin');
      this.csrfToken.set(res.csrfToken ?? '');
      return null;
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      return message || 'No se pudo iniciar sesión';
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API_URL}/auth/logout`, {}));
    } catch {
      /* still leave */
    }
    this.username.set(null);
    this.role.set('');
    this.csrfToken.set('');
    await this.router.navigateByUrl('/admin/login');
  }
}
