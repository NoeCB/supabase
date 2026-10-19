// Modelo que refleja la tabla public.clientes de Supabase
export interface Cliente {
  id?: number;
  created_at?: string;
  nombre: string;
  ciudad: string | null;
  fecha_de_alta: string | null; // formato YYYY-MM-DD
}

export type UserRole = 'admin' | 'user';
