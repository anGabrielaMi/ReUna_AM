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
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonNote,
  NavController
} from '@ionic/angular';

import { AvisosService, NuevoAviso, CATEGORIAS_AVISO } from '../services/avisos.service';
import { ComunidadService, MiComunidad } from '../services/comunidad.service';

// Formulario de avisos para líderes:
//   /avisos/nuevo        -> Publicar aviso
//   /avisos/:id/editar   -> Editar aviso desde la app (líder)
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
  comunidadesLider: MiComunidad[] = [];   // solo donde el usuario es líder (modo publicar)

  aviso: NuevoAviso = { titulo: '', contenido: '', categoria: '', comunidad: null };

  // Modo edición
  idAviso: number | null = null;
  comunidadNombre = '';        // en edición la comunidad se muestra pero no se cambia
  puedeEditar = false;

  cargando = true;
  enviando = false;
  error = '';

  constructor(
    private avisosService: AvisosService,
    private comunidadService: ComunidadService,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef
  ) {}

  get modoEdicion(): boolean {
    return this.idAviso !== null;
  }

  ionViewWillEnter() {
    // Formulario limpio cada vez que se entra
    this.aviso = { titulo: '', contenido: '', categoria: '', comunidad: null };
    this.error = '';
    this.cargando = true;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.idAviso = id ? id : null;

    if (this.modoEdicion) {
      this.cargarAvisoParaEditar(this.idAviso!);
    } else {
      this.cargarComunidadesLider();
    }
  }

  // ---------- Publicar ----------
  private cargarComunidadesLider() {
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

  // ---------- Editar ----------
  private cargarAvisoParaEditar(id: number) {
    this.avisosService.getAviso(id).subscribe({
      next: (a) => {
        this.puedeEditar = a.puede_editar;
        this.comunidadNombre = a.comunidad_nombre;
        this.aviso = {
          titulo: a.titulo,
          contenido: a.contenido,
          categoria: a.categoria,
          comunidad: a.comunidad
        };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.status === 404 ? 'El aviso no existe.' : 'No se pudo cargar el aviso.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ¿Se muestra el formulario?
  get puedeUsarFormulario(): boolean {
    return this.modoEdicion ? this.puedeEditar : this.comunidadesLider.length > 0;
  }

  get variasComunidades(): boolean {
    return !this.modoEdicion && this.comunidadesLider.length > 1;
  }

  get formularioValido(): boolean {
    return !!(
      this.aviso.titulo.trim() &&
      this.aviso.contenido.trim() &&
      this.aviso.categoria &&                        // el líder elige la categoría
      (this.aviso.comunidad || !this.variasComunidades)
    );
  }

  guardar() {
    if (!this.formularioValido || this.enviando) return;

    this.enviando = true;
    this.error = '';
    const titulo = this.aviso.titulo.trim();
    const contenido = this.aviso.contenido.trim();

    const peticion = this.modoEdicion
      // Editar: solo título, contenido y categoría (la comunidad no se cambia)
      ? this.avisosService.actualizarAviso(this.idAviso!, { titulo, contenido, categoria: this.aviso.categoria })
      : this.avisosService.crearAviso({ ...this.aviso, titulo, contenido });

    peticion.subscribe({
      next: (guardado) => {
        this.enviando = false;
        // Editar vuelve al detalle; publicar vuelve a la lista.
        // navigateBack "retrocede": así el botón Volver del detalle lleva a la lista
        // y no de nuevo al formulario
        this.navCtrl.navigateBack(this.modoEdicion ? ['/avisos', guardado.id] : ['/avisos']);
      },
      error: (err) => {
        console.error('Error guardando aviso:', err);
        // Mensajes del backend (403: no es líder ahí, 400: falta comunidad, etc.)
        this.error =
          err.error?.detail ||
          err.error?.comunidad ||
          'No se pudo guardar el aviso. Revisa los datos e intenta de nuevo.';
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
