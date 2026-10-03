import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonNote,
  IonIcon,
  NavController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { attachOutline } from 'ionicons/icons';

import { DocumentosService, EXTENSIONES_DOCUMENTO, TAMANO_MAXIMO_MB } from '../services/documentos.service';
import { ComunidadService, MiComunidad } from '../services/comunidad.service';

// Subir documento (líder): /documentos/nuevo
@Component({
  selector: 'app-subir-documento',
  templateUrl: './subir-documento.page.html',
  styleUrls: ['./subir-documento.page.scss'],
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonNote,
    IonIcon
  ]
})
export class SubirDocumentoPage {
  comunidadesLider: MiComunidad[] = [];
  titulo = '';
  comunidad: number | null = null;
  archivo: File | null = null;

  // Para el atributo accept del input y los mensajes
  aceptar = EXTENSIONES_DOCUMENTO.map(e => '.' + e).join(',');
  formatos = EXTENSIONES_DOCUMENTO.map(e => e.toUpperCase()).join(', ');
  tamanoMaximo = TAMANO_MAXIMO_MB;

  cargando = true;
  enviando = false;
  error = '';
  errorArchivo = '';

  constructor(
    private documentosService: DocumentosService,
    private comunidadService: ComunidadService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ attachOutline });
  }

  ionViewWillEnter() {
    // Formulario limpio cada vez que se entra
    this.titulo = '';
    this.comunidad = null;
    this.archivo = null;
    this.error = '';
    this.errorArchivo = '';
    this.cargando = true;

    this.comunidadService.getMisComunidades().subscribe({
      next: (comunidades) => {
        this.comunidadesLider = comunidades.filter(c => c.rol === 'lider');
        // Si es líder de una sola comunidad, se asigna automáticamente
        if (this.comunidadesLider.length === 1) {
          this.comunidad = this.comunidadesLider[0].id;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Debes iniciar sesión para subir documentos.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get esLider(): boolean {
    return this.comunidadesLider.length > 0;
  }

  get variasComunidades(): boolean {
    return this.comunidadesLider.length > 1;
  }

  // Subir documento – criterio 2: se revisa formato y tamaño antes de enviar
  // (el backend lo vuelve a revisar igual)
  elegirArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorArchivo = '';
    this.archivo = null;
    if (!archivo) return;

    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_DOCUMENTO.includes(extension)) {
      this.errorArchivo = `Formato no permitido. Usa: ${this.formatos}.`;
      input.value = '';
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      this.errorArchivo = `El archivo supera el máximo de ${TAMANO_MAXIMO_MB} MB.`;
      input.value = '';
      return;
    }
    this.archivo = archivo;
    // Si no escribió título, se sugiere el nombre del archivo (sin extensión)
    if (!this.titulo.trim()) {
      this.titulo = archivo.name.replace(/\.[^.]+$/, '');
    }
  }

  get formularioValido(): boolean {
    return !!(this.titulo.trim() && this.archivo && this.comunidad);
  }

  subir() {
    if (!this.formularioValido || this.enviando) return;

    this.enviando = true;
    this.error = '';
    this.documentosService.subirDocumento(this.titulo.trim(), this.archivo!, this.comunidad).subscribe({
      next: async () => {
        this.enviando = false;
        // Subir documento – criterio 3: mensaje de éxito
        const toast = await this.toastCtrl.create({
          message: 'Documento subido correctamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        this.navCtrl.navigateBack('/documentos');
      },
      error: (err) => {
        console.error('Error subiendo documento:', err);
        // Mensajes del backend (403: no es líder ahí; 400: formato, tamaño, comunidad...)
        const e = err.error ?? {};
        this.error =
          e.detail ||
          (Array.isArray(e.archivo) ? e.archivo[0] : e.archivo) ||
          (Array.isArray(e.comunidad) ? e.comunidad[0] : e.comunidad) ||
          (Array.isArray(e.titulo) ? e.titulo[0] : e.titulo) ||
          'No se pudo subir el documento. Intenta de nuevo.';
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
