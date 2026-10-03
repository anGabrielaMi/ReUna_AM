import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, checkmarkCircle, arrowForwardOutline, timeOutline } from 'ionicons/icons';

import { EncuestasService, Encuesta, EstadoEncuestas } from '../services/encuestas.service';
import { ComunidadService } from '../services/comunidad.service';

// Responder encuesta – criterio 1: encuestas de mis comunidades con su fecha de cierre
@Component({
  selector: 'app-encuestas',
  templateUrl: './encuestas.page.html',
  styleUrls: ['./encuestas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonBadge,
    IonSpinner
  ]
})
export class EncuestasPage {
  encuestas: Encuesta[] = [];
  estado: EstadoEncuestas = 'abiertas';
  esLider = false;
  sinComunidades = false;

  cargando = false;
  error = '';

  constructor(
    private encuestasService: EncuestasService,
    private comunidadService: ComunidadService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ addOutline, createOutline, checkmarkCircle, arrowForwardOutline, timeOutline });
  }

  // Se recarga cada vez que se entra (así aparece la encuesta recién creada o respondida)
  ionViewWillEnter() {
    this.cargarEncuestas();
    this.comunidadService.getMisComunidades().subscribe({
      next: (comunidades) => {
        // Crear encuesta: el botón solo aparece si es líder en alguna comunidad
        this.esLider = comunidades.some(c => c.rol === 'lider');
        this.sinComunidades = comunidades.length === 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.esLider = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarEncuestas() {
    this.cargando = true;
    this.error = '';
    this.encuestasService.getEncuestas(this.estado).subscribe({
      next: (data) => {
        this.encuestas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando encuestas:', err);
        this.error = 'No se pudieron cargar las encuestas.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarEstado(evento: CustomEvent) {
    this.estado = (evento.detail.value ?? '') as EstadoEncuestas;
    this.cargarEncuestas();
  }

  mensajeVacio(): string {
    if (this.sinComunidades) return 'Aún no perteneces a ninguna comunidad.';
    if (this.estado === 'abiertas') return 'No hay encuestas abiertas en tus comunidades.';
    if (this.estado === 'cerradas') return 'No hay encuestas cerradas.';
    return 'No hay encuestas en tus comunidades.';
  }
}
