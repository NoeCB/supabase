// Modelo que refleja la tabla public.clients de Supabase (script del profesor)
export interface Client {
  id?: string; // UUID
  nombre: string;
  empresa: string;
  email: string;
  created_at?: string;
}

export type UserRole = 'admin' | 'user';
