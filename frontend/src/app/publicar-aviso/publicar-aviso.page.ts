import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonNote
} from '@ionic/angular';

import { AvisosService, NuevoAviso, CATEGORIAS_AVISO } from '../services/avisos.service';
import { ComunidadService, MiComunidad } from '../services/comunidad.service';

// Publicar aviso: formulario para líderes de comunidad
@Component({
  selector: 'app-publicar-aviso',
  templateUrl: './publicar-aviso.page.html',
  styleUrls: ['./publicar-aviso.page.scss'],
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonNote
  ]
})
export class PublicarAvisoPage {
  categorias = CATEGORIAS_AVISO;
  comunidadesLider: MiComunidad[] = [];   // solo donde el usuario es líder

  aviso: NuevoAviso = { titulo: '', contenido: '', categoria: '', comunidad: null };

  cargando = true;
  enviando = false;
  error = '';

  constructor(
    private avisosService: AvisosService,
    private comunidadService: ComunidadService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    // Formulario limpio cada vez que se entra
    this.aviso = { titulo: '', contenido: '', categoria: '', comunidad: null };
    this.error = '';
    this.cargando = true;

    this.comunidadService.getMisComunidades().subscribe({
      next: (comunidades) => {
        this.comunidadesLider = comunidades.filter(c => c.rol === 'lider');
        // Criterio: si es líder de una sola comunidad, se asocia automáticamente
        if (this.comunidadesLider.length === 1) {
          this.aviso.comunidad = this.comunidadesLider[0].id;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Debes iniciar sesión para publicar avisos.';
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

  get formularioValido(): boolean {
    return !!(
      this.aviso.titulo.trim() &&
      this.aviso.contenido.trim() &&
      this.aviso.categoria &&                        // criterio: el líder elige la categoría
      (this.aviso.comunidad || !this.variasComunidades)
    );
  }

  publicar() {
    if (!this.formularioValido || this.enviando) return;

    this.enviando = true;
    this.error = '';
    const datos: NuevoAviso = {
      ...this.aviso,
      titulo: this.aviso.titulo.trim(),
      contenido: this.aviso.contenido.trim()
    };

    this.avisosService.crearAviso(datos).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/avisos']);
      },
      error: (err) => {
        console.error('Error publicando aviso:', err);
        // Mensajes que manda el backend (403: no es líder ahí, 400: falta comunidad, etc.)
        this.error =
          err.error?.detail ||
          err.error?.comunidad ||
          'No se pudo publicar el aviso. Revisa los datos e intenta de nuevo.';
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
