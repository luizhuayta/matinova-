import { Routes } from '@angular/router';
import { adminAuthGuard, adminGuestGuard } from './cms/auth.guard';

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
          { path: 'mensajes', loadComponent: () => import('./admin/admin-messages').then(m => m.AdminMessages) },
          { path: 'archivos', loadComponent: () => import('./admin/admin-media').then(m => m.AdminMedia) },
        ]
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'acerca-de',
    loadComponent: () => import('./pages/acerca-de/acerca-de').then(m => m.AcercaDe)
  },
  {
    path: 'servicios',
    loadComponent: () => import('./pages/servicios/servicios').then(m => m.Servicios)
  },
  {
    path: 'servicios/saas',
    loadComponent: () => import('./pages/servicios/saas/saas').then(m => m.Saas)
  },
  {
    path: 'servicios/hardware',
    loadComponent: () => import('./pages/servicios/hardware/hardware').then(m => m.Hardware)
  },
  {
    path: 'servicios/software',
    loadComponent: () => import('./pages/servicios/software/software').then(m => m.Software)
  },
  {
    path: 'servicios/consultoria',
    loadComponent: () => import('./pages/servicios/consultoria/consultoria').then(m => m.Consultoria)
  },
  {
    path: 'servicios/soluciones-ti',
    loadComponent: () => import('./pages/servicios/soluciones-ti/soluciones-ti').then(m => m.SolucionesTi)
  },
  {
    path: 'contacto',
    loadComponent: () => import('./pages/contacto/contacto').then(m => m.Contacto)
  },
  {
    path: 'libro-reclamaciones',
    loadComponent: () => import('./components/libro-reclamaciones/libro-reclamaciones').then(m => m.LibroReclamacionesComponent)
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./pages/privacidad/privacidad').then(m => m.Privacidad)
  },
  {
    path: 'terminos',
    loadComponent: () => import('./pages/terminos/terminos').then(m => m.Terminos)
  }
];
