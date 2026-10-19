import { Routes } from '@angular/router';

// Acceso libre: cualquiera puede ver clientes y galería.
// El login se pide solo al intentar modificar datos (ver tab1.page.ts).
export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
