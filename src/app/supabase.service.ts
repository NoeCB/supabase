import { Injectable, computed, signal } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Client, UserRole } from './models/client.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  // Estado global reactivo (Signals)
  readonly currentUser = signal<User | null>(null);
  readonly userRole = signal<UserRole | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.userRole() === 'admin');

  // Promesa que se resuelve cuando la sesión inicial está cargada.
  // El guard la espera para evitar la race condition del PDF original.
  readonly ready: Promise<void>;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.ready = this.supabase.auth
      .getSession()
      .then(({ data }) => this.applySession(data.session));

    // Mantiene el estado sincronizado (login, logout, refresco de token...)
    this.supabase.auth.onAuthStateChange((_event, session) => {
      // setTimeout: Supabase recomienda no hacer llamadas await dentro del callback
      setTimeout(() => this.applySession(session), 0);
    });
  }

  // --- AUTENTICACIÓN Y ROLES ---

  private async applySession(session: Session | null): Promise<void> {
    const user = session?.user ?? null;
    this.currentUser.set(user);
    if (user) {
      await this.loadRole(user.id);
    } else {
      this.userRole.set(null);
    }
  }

  private async loadRole(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error cargando el rol:', error.message);
    }
    // Sin perfil o con error, se asume el rol con menos privilegios
    this.userRole.set((data?.role as UserRole) ?? 'user');
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.applySession(data.session);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    await this.applySession(null);
  }

  // --- CRUD CLIENTES (tabla public.clients) ---

  async getClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  // Renombrado (en el PDF se llamaba createClient y chocaba con el import de Supabase)
  async addClient(client: Client): Promise<void> {
    const { error } = await this.supabase.from('clients').insert({
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email,
    });
    if (error) throw error;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    // .select() permite detectar si RLS ha bloqueado la operación:
    // Supabase no da error, simplemente no modifica ninguna fila.
    const { data, error } = await this.supabase
      .from('clients')
      .update({ nombre: client.nombre, empresa: client.empresa, email: client.email })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data?.length) throw new Error('No tienes permisos para editar este cliente');
  }

  async deleteClient(id: string): Promise<void> {
    const { data, error } = await this.supabase.from('clients').delete().eq('id', id).select();
    if (error) throw error;
    if (!data?.length) throw new Error('No tienes permisos para borrar este cliente');
  }
}
