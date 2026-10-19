import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { StorageImage } from '../models/storage-image.model';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-galeria',
  templateUrl: 'galeria.page.html',
  styleUrls: ['galeria.page.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonText,
  ],
})
export class GaleriaPage implements OnInit {
  private readonly supabase = inject(SupabaseService);

  readonly images = signal<StorageImage[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal('');

  async ngOnInit() {
    await this.loadImages();
  }

  async loadImages() {
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      this.images.set(await this.supabase.getGalleryImages());
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se han podido cargar las imágenes');
    } finally {
      this.loading.set(false);
    }
  }

  // Deslizar hacia abajo para recargar
  async refresh(event: CustomEvent) {
    await this.loadImages();
    (event.target as HTMLIonRefresherElement).complete();
  }
}
