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
  IonIcon,
  NavController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, closeOutline } from 'ionicons/icons';

import { EncuestasService, NuevaEncuesta, Pregunta, LIMITES_ENCUESTA } from '../services/encuestas.service';
import { ComunidadService, MiComunidad } from '../services/comunidad.service';

// Formulario de encuestas para líderes:
//   /encuestas/nueva          -> Crear encuesta
//   /encuestas/:id/editar     -> Editar (solo si nadie ha respondido)
@Component({
  selector: 'app-crear-encuesta',
  templateUrl: './crear-encuesta.page.html',
  styleUrls: ['./crear-encuesta.page.scss'],
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
    IonNote,
    IonIcon
  ]
})
export class CrearEncuestaPage {
  limites = LIMITES_ENCUESTA;
  comunidadesLider: MiComunidad[] = [];
  encuesta: NuevaEncuesta = this.vacia();

  // Modo edición
  idEncuesta: number | null = null;
  comunidadNombre = '';
  puedeEditar = false;

  cargando = true;
  enviando = false;
  error = '';

  constructor(
    private encuestasService: EncuestasService,
    private comunidadService: ComunidadService,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ addOutline, trashOutline, closeOutline });
  }

  get modoEdicion(): boolean {
    return this.idEncuesta !== null;
  }

  ionViewWillEnter() {
    this.encuesta = this.vacia();
    this.error = '';
    this.cargando = true;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.idEncuesta = id ? id : null;

    if (this.modoEdicion) {
      this.cargarParaEditar(this.idEncuesta!);
    } else {
      this.cargarComunidadesLider();
    }
  }

  private vacia(): NuevaEncuesta {
    return {
      titulo: '',
      descripcion: '',
      fecha_cierre: '',
      comunidad: null,
      preguntas: [this.preguntaVacia()]
    };
  }

  private preguntaVacia(): Pregunta {
    return { texto: '', alternativas: [{ texto: '' }, { texto: '' }] };
  }

  // ---------- Crear ----------
  private cargarComunidadesLider() {
    this.comunidadService.getMisComunidades().subscribe({
      next: (comunidades) => {
        this.comunidadesLider = comunidades.filter(c => c.rol === 'lider');
        // Criterio 4: si es líder de una sola comunidad, se asocia automáticamente
        if (this.comunidadesLider.length === 1) {
          this.encuesta.comunidad = this.comunidadesLider[0].id;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Debes iniciar sesión para crear encuestas.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- Editar ----------
  private cargarParaEditar(id: number) {
    this.encuestasService.getEncuesta(id).subscribe({
      next: (e) => {
        this.puedeEditar = e.puede_editar && e.abierta;
        this.comunidadNombre = e.comunidad_nombre;
        this.encuesta = {
          titulo: e.titulo,
          descripcion: e.descripcion,
          fecha_cierre: this.aInputLocal(e.fecha_cierre),
          comunidad: e.comunidad,
          preguntas: e.preguntas.map(p => ({
            texto: p.texto,
            alternativas: p.alternativas.map(a => ({ texto: a.texto }))
          }))
        };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.status === 404 ? 'La encuesta no existe.' : 'No se pudo cargar la encuesta.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // '2026-10-10T18:00:00-03:00' -> '2026-10-10T18:00' (formato del input de fecha y hora)
  private aInputLocal(iso: string): string {
    const d = new Date(iso);
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
  }

  // ---------- Preguntas y alternativas (criterios 1 y 2) ----------
  agregarPregunta() {
    if (this.encuesta.preguntas.length < this.limites.maxPreguntas) {
      this.encuesta.preguntas.push(this.preguntaVacia());
    }
  }

  quitarPregunta(i: number) {
    if (this.encuesta.preguntas.length > this.limites.minPreguntas) {
      this.encuesta.preguntas.splice(i, 1);
    }
  }

  agregarAlternativa(p: Pregunta) {
    if (p.alternativas.length < this.limites.maxAlternativas) {
      p.alternativas.push({ texto: '' });
    }
  }

  quitarAlternativa(p: Pregunta, j: number) {
    if (p.alternativas.length > this.limites.minAlternativas) {
      p.alternativas.splice(j, 1);
    }
  }

  // Evita que los campos pierdan el foco al escribir dentro de listas
  porIndice(i: number) {
    return i;
  }

  // ---------- Estado del formulario ----------
  get puedeUsarFormulario(): boolean {
    return this.modoEdicion ? this.puedeEditar : this.comunidadesLider.length > 0;
  }

  get variasComunidades(): boolean {
    return !this.modoEdicion && this.comunidadesLider.length > 1;
  }

  // Mínimo para la fecha de cierre (criterio 3: posterior a ahora)
  get ahoraLocal(): string {
    return this.aInputLocal(new Date().toISOString());
  }

  get problemas(): string[] {
    const lista: string[] = [];
    const e = this.encuesta;
    if (!e.titulo.trim()) lista.push('Escribe el título.');
    if (!e.fecha_cierre) lista.push('Elige la fecha de cierre.');
    else if (new Date(e.fecha_cierre) <= new Date()) lista.push('La fecha de cierre debe ser posterior a ahora.');
    if (this.variasComunidades && !e.comunidad) lista.push('Elige la comunidad.');
    e.preguntas.forEach((p, i) => {
      if (!p.texto.trim()) lista.push(`Escribe el texto de la pregunta ${i + 1}.`);
      if (p.alternativas.some(a => !a.texto.trim())) lista.push(`Completa las alternativas de la pregunta ${i + 1}.`);
      const textos = p.alternativas.map(a => a.texto.trim().toLowerCase()).filter(t => t);
      if (new Set(textos).size !== textos.length) lista.push(`La pregunta ${i + 1} tiene alternativas repetidas.`);
    });
    return lista;
  }

  guardar() {
    if (this.problemas.length || this.enviando) return;

    this.enviando = true;
    this.error = '';
    const datos: NuevaEncuesta = {
      titulo: this.encuesta.titulo.trim(),
      descripcion: this.encuesta.descripcion.trim(),
      fecha_cierre: this.encuesta.fecha_cierre,
      comunidad: this.encuesta.comunidad,
      preguntas: this.encuesta.preguntas.map(p => ({
        texto: p.texto.trim(),
        alternativas: p.alternativas.map(a => ({ texto: a.texto.trim() }))
      }))
    };

    const peticion = this.modoEdicion
      ? this.encuestasService.actualizarEncuesta(this.idEncuesta!, datos)
      : this.encuestasService.crearEncuesta(datos);

    peticion.subscribe({
      next: async () => {
        this.enviando = false;
        const toast = await this.toastCtrl.create({
          message: this.modoEdicion ? 'Encuesta actualizada.' : 'Encuesta creada.',
          duration: 2500,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        this.navCtrl.navigateBack('/encuestas');
      },
      error: (err) => {
        console.error('Error guardando encuesta:', err);
        this.error = this.mensajeError(err.error);
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Toma el primer mensaje que mande el backend (puede venir anidado en preguntas)
  private mensajeError(e: any): string {
    const primero = (v: any): string | null => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (Array.isArray(v)) {
        for (const x of v) { const m = primero(x); if (m) return m; }
        return null;
      }
      if (typeof v === 'object') {
        for (const k of Object.keys(v)) { const m = primero(v[k]); if (m) return m; }
      }
      return null;
    };
    return primero(e) || 'No se pudo guardar la encuesta. Revisa los datos e intenta de nuevo.';
  }
}
