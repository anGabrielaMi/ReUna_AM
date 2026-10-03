import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonList,
  IonSpinner,
  IonNote,
  IonIcon,
  NavController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, lockClosedOutline, timeOutline } from 'ionicons/icons';

import { EncuestasService, Encuesta } from '../services/encuestas.service';

// Responder encuesta: /encuestas/:id
@Component({
  selector: 'app-responder-encuesta',
  templateUrl: './responder-encuesta.page.html',
  styleUrls: ['./responder-encuesta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonList,
    IonSpinner,
    IonNote,
    IonIcon
  ]
})
export class ResponderEncuestaPage {
  encuesta: Encuesta | null = null;
  // Alternativa elegida por pregunta: { idPregunta: idAlternativa }
  elegidas: Record<number, number | null> = {};

  cargando = true;
  enviando = false;
  error = '';

  constructor(
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ checkmarkCircle, lockClosedOutline, timeOutline });
  }

  ionViewWillEnter() {
    this.cargando = true;
    this.error = '';
    this.encuesta = null;
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.encuestasService.getEncuesta(id).subscribe({
      next: (e) => {
        this.encuesta = e;
        this.elegidas = {};
        e.preguntas.forEach(p => (this.elegidas[p.id!] = null));
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.status === 404
          ? 'La encuesta no existe o no pertenece a tus comunidades.'
          : 'No se pudo cargar la encuesta.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get puedeResponder(): boolean {
    return !!this.encuesta && this.encuesta.abierta && !this.encuesta.ya_respondi;
  }

  // Criterio 2: no se puede enviar sin contestar todas las preguntas
  get faltan(): number {
    return Object.values(this.elegidas).filter(v => v === null).length;
  }

  enviar() {
    if (!this.encuesta || this.faltan > 0 || this.enviando) return;

    this.enviando = true;
    this.error = '';
    const respuestas = Object.entries(this.elegidas).map(([pregunta, alternativa]) => ({
      pregunta: Number(pregunta),
      alternativa: alternativa as number
    }));

    this.encuestasService.responder(this.encuesta.id, respuestas).subscribe({
      next: async (res) => {
        this.enviando = false;
        // Criterio 5: confirmación al responder
        const toast = await this.toastCtrl.create({
          message: res.detail || '¡Gracias! Tu respuesta fue registrada.',
          duration: 2500,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        this.navCtrl.navigateBack('/encuestas');
      },
      error: (err) => {
        console.error('Error respondiendo encuesta:', err);
        const e = err.error ?? {};
        this.error =
          e.detail ||
          (Array.isArray(e.respuestas) ? e.respuestas[0] : e.respuestas) ||
          'No se pudo enviar tu respuesta. Intenta de nuevo.';
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
