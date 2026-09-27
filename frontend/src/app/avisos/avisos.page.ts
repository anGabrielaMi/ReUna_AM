import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, funnelOutline, closeCircleOutline, addOutline } from 'ionicons/icons';

import { AvisosService, Aviso, FiltrosAvisos, CATEGORIAS_AVISO } from '../services/avisos.service';
import { ComunidadService } from '../services/comunidad.service';

@Component({
  selector: 'app-avisos',
  templateUrl: './avisos.page.html',
  styleUrls: ['./avisos.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonBadge
  ]
})
export class AvisosPage implements OnInit {
  avisos: Aviso[] = [];
  categorias = CATEGORIAS_AVISO;
  filtros: FiltrosAvisos = { categoria: '', desde: '', hasta: '' };
  cargando = false;
  error = '';
  // Publicar aviso: el botón solo se muestra si es líder en alguna comunidad
  esLider = false;

  constructor(
    private avisosService: AvisosService,
    private comunidadService: ComunidadService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ arrowForwardOutline, funnelOutline, closeCircleOutline, addOutline });
  }

  ngOnInit() {}

  // Ionic reutiliza la página: se recarga cada vez que se entra
  // (así aparece el aviso recién publicado al volver del formulario)
  ionViewWillEnter() {
    this.loadAvisos();
    this.revisarSiEsLider();
  }

  revisarSiEsLider() {
    if (!this.sesionIniciada) {
      this.esLider = false;
      return;
    }
    this.comunidadService.getMisComunidades().subscribe({
      next: (comunidades) => {
        this.esLider = comunidades.some(c => c.rol === 'lider');
        this.cdr.detectChanges();
      },
      error: () => {
        this.esLider = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAvisos() {
    // Validación simple del rango de fechas
    if (this.filtros.desde && this.filtros.hasta && this.filtros.desde > this.filtros.hasta) {
      this.error = 'La fecha "desde" no puede ser posterior a la fecha "hasta".';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.error = '';
    this.avisosService.getAvisos(this.filtros).subscribe({
      next: (data: Aviso[]) => {
        this.avisos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando avisos:', err);
        this.error = 'No se pudieron cargar los avisos.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarFiltros() {
    this.filtros = { categoria: '', desde: '', hasta: '' };
    this.loadAvisos();
  }

  // Sin sesión solo se ven avisos de plataforma; se invita a iniciar sesión
  get sesionIniciada(): boolean {
    try {
      return !!localStorage.getItem('access');
    } catch {
      return false;
    }
  }

  get hayFiltros(): boolean {
    return !!(this.filtros.categoria || this.filtros.desde || this.filtros.hasta);
  }

  // Vista previa en la tarjeta; el contenido completo se ve en el detalle
  resumen(texto: string, max = 120): string {
    return texto.length > max ? texto.slice(0, max).trim() + '…' : texto;
  }
}
