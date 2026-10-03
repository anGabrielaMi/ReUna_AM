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
  IonSelect,
  IonSelectOption,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, downloadOutline, documentTextOutline, imageOutline, documentOutline } from 'ionicons/icons';

import { DocumentosService, Documento } from '../services/documentos.service';
import { ComunidadService, MiComunidad } from '../services/comunidad.service';

// Consultar documento: lista de documentos de mis comunidades
@Component({
  selector: 'app-documentos',
  templateUrl: './documentos.page.html',
  styleUrls: ['./documentos.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonSpinner
  ]
})
export class DocumentosPage {
  documentos: Documento[] = [];
  misComunidades: MiComunidad[] = [];
  comunidadFiltro: number | null = null;   // null = todas mis comunidades

  cargando = false;
  descargandoId: number | null = null;
  error = '';

  constructor(
    private documentosService: DocumentosService,
    private comunidadService: ComunidadService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ addOutline, downloadOutline, documentTextOutline, imageOutline, documentOutline });
  }

  // Ionic reutiliza la página: se recarga cada vez que se entra
  // (así aparece el documento recién subido al volver del formulario)
  ionViewWillEnter() {
    this.cargarComunidades();
    this.cargarDocumentos();
  }

  // Subir documento – criterio 1: el botón solo aparece si es líder en alguna comunidad
  get esLider(): boolean {
    return this.misComunidades.some(c => c.rol === 'lider');
  }

  cargarComunidades() {
    this.comunidadService.getMisComunidades().subscribe({
      next: (comunidades) => {
        this.misComunidades = comunidades;
        this.cdr.detectChanges();
      },
      error: () => {
        this.misComunidades = [];
        this.cdr.detectChanges();
      }
    });
  }

  cargarDocumentos() {
    this.cargando = true;
    this.error = '';
    this.documentosService.getDocumentos(this.comunidadFiltro).subscribe({
      next: (data) => {
        this.documentos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando documentos:', err);
        this.error = 'No se pudieron cargar los documentos.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Consultar documento – criterio 3: abrir o descargar el documento
  descargar(doc: Documento) {
    if (this.descargandoId) return;
    this.descargandoId = doc.id;
    this.error = '';
    this.documentosService.descargar(doc.id).subscribe({
      next: (blob) => {
        // Se crea un link temporal al archivo y se "hace clic" para que el navegador lo guarde
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nombre_archivo;
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error descargando documento:', err);
        this.error = err.status === 404
          ? 'El documento ya no está disponible.'
          : 'No se pudo descargar el documento.';
        this.descargandoId = null;
        this.cdr.detectChanges();
      }
    });
  }

  icono(doc: Documento): string {
    if (['jpg', 'jpeg', 'png'].includes(doc.extension)) return 'image-outline';
    if (doc.extension === 'pdf') return 'document-text-outline';
    return 'document-outline';
  }

  // 1536000 -> "1,5 MB"
  tamanoLegible(bytes: number | null): string {
    if (bytes === null) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
}
