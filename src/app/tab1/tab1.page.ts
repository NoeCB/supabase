import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonRow,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, logOutOutline, trashOutline } from 'ionicons/icons';
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
    IonToast,
  ],
})
export class Tab1Page implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Estado de la vista con Signals
  readonly clients = signal<Client[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly toastMessage = signal('');
  readonly isToastOpen = signal(false);

  // Expuestos a la plantilla (isAdmin ahora sí es un booleano)
  readonly isAdmin = this.supabase.isAdmin;
  readonly user = this.supabase.currentUser;

  readonly clientForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    empresa: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    addIcons({ createOutline, trashOutline, logOutOutline });
  }

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients.set(await this.supabase.getClients());
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  async saveClient() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
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
  }

  editClient(client: Client, sliding: IonItemSliding) {
    sliding.close();
    this.editingId.set(client.id ?? null);
    this.clientForm.setValue({
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email,
    });
  }

  async deleteClient(client: Client, sliding: IonItemSliding) {
    sliding.close();
    if (!client.id) return;
    if (!confirm(`¿Eliminar a ${client.nombre}?`)) return;
    try {
      await this.supabase.deleteClient(client.id);
      this.showToast('Cliente eliminado');
      if (this.editingId() === client.id) this.resetForm();
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error eliminando: ' + e.message);
    }
  }

  resetForm() {
    this.clientForm.reset();
    this.editingId.set(null);
  }

  async logout() {
    await this.supabase.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }
}
