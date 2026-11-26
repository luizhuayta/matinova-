import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app/app.routes';
import { credentialsInterceptor } from './app/cms/credentials.interceptor';

const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withNavigationErrorHandler((event) => {
      reloadOnceForChunkError(event.error ?? event);
    })),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
  ]
};

const CHUNK_RELOAD_KEY = 'matt-chunk-load-reload';
let chunkReloadScheduled = false;

function errorText(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return `${String(record['name'] ?? '')}: ${String(record['message'] ?? '')}`;
  }
  return String(error ?? '');
}

function isChunkLoadError(error: unknown): boolean {
  return /chunkloaderror|loading chunk|failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script/i.test(errorText(error));
}

function readSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, 'true');
  } catch {
    /* private mode */
  }
}

async function clearLegacyServiceWorkerState(): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if ('serviceWorker' in navigator) {
    tasks.push(
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    );
  }
  if ('caches' in window) {
    tasks.push(
      caches.keys()
        .then((names) => Promise.all(names.filter((name) => name.startsWith('ngsw:')).map((name) => caches.delete(name))))
    );
  }
  try {
    await Promise.all(tasks);
  } catch {
    /* best effort */
  }
}

function reloadOnceForChunkError(error: unknown): void {
  if (!isChunkLoadError(error) || chunkReloadScheduled || readSessionFlag(CHUNK_RELOAD_KEY)) {
    return;
  }
  chunkReloadScheduled = true;
  writeSessionFlag(CHUNK_RELOAD_KEY);
  void clearLegacyServiceWorkerState().finally(() => window.location.reload());
}

function installChunkLoadRecovery(): void {
  window.addEventListener('error', (event) => {
    reloadOnceForChunkError(event.error ?? event.message);
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    reloadOnceForChunkError(event.reason);
  });
}

installChunkLoadRecovery();
void clearLegacyServiceWorkerState();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
