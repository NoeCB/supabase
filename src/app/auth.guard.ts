import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

// Solo deja pasar a usuarios autenticados.
// Espera a que la sesión inicial esté cargada antes de decidir.
export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.ready;
  return supabase.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

// Evita volver al login si ya hay sesión iniciada
export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.ready;
  return supabase.isAuthenticated() ? router.createUrlTree(['/tabs/tab1']) : true;
};
