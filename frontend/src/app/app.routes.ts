import { Routes } from '@angular/router';
import { adminAuthGuard, adminGuestGuard } from './cms/auth.guard';

const publicPage = () => import('./pages/dynamic-page/dynamic-page').then(m => m.DynamicPage);

export const routes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        canActivate: [adminGuestGuard],
        loadComponent: () => import('./admin/login').then(m => m.AdminLogin)
      },
      {
        path: '',
        canActivate: [adminAuthGuard],
        loadComponent: () => import('./admin/admin-shell').then(m => m.AdminShell),
        children: [
          { path: '', loadComponent: () => import('./admin/admin-home').then(m => m.AdminHome) },
          { path: 'paginas', loadComponent: () => import('./admin/admin-pages').then(m => m.AdminPages) },
          { path: 'paginas/:slug', loadComponent: () => import('./admin/page-editor').then(m => m.PageEditor) },
          { path: 'chatbot', loadComponent: () => import('./admin/admin-chatbot').then(m => m.AdminChatbot) },
          { path: 'mensajes', loadComponent: () => import('./admin/admin-messages').then(m => m.AdminMessages) },
          { path: 'archivos', loadComponent: () => import('./admin/admin-media').then(m => m.AdminMedia) },
          { path: 'usuarios', loadComponent: () => import('./admin/admin-users').then(m => m.AdminUsers) },
          { path: 'webhooks', loadComponent: () => import('./admin/admin-webhooks').then(m => m.AdminWebhooks) },
        ]
      }
    ]
  },
  { path: 'en', loadComponent: publicPage, data: { locale: 'en', slug: 'inicio' } },
  { path: 'en/servicios/:suffix', loadComponent: publicPage, data: { locale: 'en' } },
  { path: 'en/:slug', loadComponent: publicPage, data: { locale: 'en' } },
  { path: 'es', loadComponent: publicPage, data: { locale: 'es', slug: 'inicio' } },
  { path: 'es/servicios/:suffix', loadComponent: publicPage, data: { locale: 'es' } },
  { path: 'es/:slug', loadComponent: publicPage, data: { locale: 'es' } },
  { path: '', loadComponent: publicPage, data: { slug: 'inicio', locale: 'es' } },
  { path: 'servicios/:suffix', loadComponent: publicPage, data: { locale: 'es' } },
  { path: '**', loadComponent: publicPage, data: { locale: 'es' } },
];
