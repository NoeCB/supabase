import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonRow,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { Client } from '../models/client.model';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonInput,
    IonIcon,
    IonModal,
    IonNote,
    IonText,
    IonToast,
  ],
})
export class Tab1Page implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  // Estado de la vista con Signals
  readonly clients = signal<Client[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly toastMessage = signal('');
  readonly isToastOpen = signal(false);

  // Estado de la sesión (viene del servicio)
  readonly isAdmin = this.supabase.isAdmin;
  readonly isAuthenticated = this.supabase.isAuthenticated;
  readonly userRole = this.supabase.userRole;
  readonly user = this.supabase.currentUser;

  // Modal de login
  readonly loginOpen = signal(false);
  readonly loginLoading = signal(false);
  readonly loginError = signal('');
  // Acción que el usuario quería hacer antes de que se le pidiera el login
  private pendingAction: (() => Promise<void>) | null = null;

  readonly clientForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    empresa: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    addIcons({ createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.supabase.ready;
    await this.loadClients();
  }

  // --- LECTURA (pública, sin login) ---

  async loadClients() {
    try {
      this.clients.set(await this.supabase.getClients());
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  // --- CONTROL DE PERMISOS ---

  /**
   * Ejecuta una acción de escritura solo si el usuario es admin.
   * - Sin sesión: abre el login y la acción se ejecuta al entrar.
   * - Con sesión pero sin rol admin: avisa de que no tiene permisos.
   */
  private async runAsAdmin(action: () => Promise<void>) {
    if (!this.isAuthenticated()) {
      this.pendingAction = action;
      this.loginError.set('');
      this.loginOpen.set(true);
      return;
    }
    if (!this.isAdmin()) {
      this.showToast('No tienes permisos para modificar clientes');
      return;
    }
    await action();
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loginLoading.set(true);
    this.loginError.set('');
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.supabase.login(email, password);
      this.loginOpen.set(false);
      this.loginForm.reset();

      // Retomar lo que el usuario intentaba hacer
      const action = this.pendingAction;
      this.pendingAction = null;
      if (action) await this.runAsAdmin(action);
    } catch (e: any) {
      this.loginError.set(e?.message ?? 'No se ha podido iniciar sesión');
    } finally {
      this.loginLoading.set(false);
    }
  }

  closeLogin() {
    this.loginOpen.set(false);
    this.pendingAction = null;
  }

  async logout() {
    await this.supabase.logout();
    this.resetForm();
    this.showToast('Sesión cerrada');
  }

  // --- ESCRITURA (solo admin) ---

  async saveClient() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    await this.runAsAdmin(async () => {
      const value = this.clientForm.getRawValue();
      const id = this.editingId();
      try {
        if (id !== null) {
          await this.supabase.updateClient(id, value);
          this.showToast('Cliente actualizado');
        } else {
          await this.supabase.addClient(value);
          this.showToast('Cliente insertado');
        }
        this.resetForm();
        await this.loadClients();
      } catch (e: any) {
        this.showToast('Error al guardar: ' + e.message);
      }
    });
  }

  async editClient(client: Client, sliding: IonItemSliding) {
    sliding.close();
    await this.runAsAdmin(async () => {
      this.editingId.set(client.id ?? null);
      this.clientForm.setValue({
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email,
      });
    });
  }

  async deleteClient(client: Client, sliding: IonItemSliding) {
    sliding.close();
    if (!client.id) return;
    await this.runAsAdmin(async () => {
      if (!confirm(`¿Eliminar a ${client.nombre}?`)) return;
      try {
        await this.supabase.deleteClient(client.id!);
        this.showToast('Cliente eliminado');
        if (this.editingId() === client.id) this.resetForm();
        await this.loadClients();
      } catch (e: any) {
        this.showToast('Error eliminando: ' + e.message);
      }
    });
  }

  resetForm() {
    this.clientForm.reset();
    this.editingId.set(null);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }
}
