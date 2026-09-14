import { Routes } from '@angular/router';

export const routes: Routes = [
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
