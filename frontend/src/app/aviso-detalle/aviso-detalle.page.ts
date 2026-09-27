import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonSpinner,
  IonButton,
  IonIcon
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline } from 'ionicons/icons';

import { AvisosService, Aviso } from '../services/avisos.service';

// Criterio 2: el usuario abre un aviso y lee su contenido completo
@Component({
  selector: 'app-aviso-detalle',
  templateUrl: './aviso-detalle.page.html',
  styleUrls: ['./aviso-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonBadge,
    IonSpinner,
    IonButton,
    IonIcon,
    RouterLink
  ]
})
export class AvisoDetallePage implements OnInit {
  aviso?: Aviso;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private avisosService: AvisosService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ createOutline });
  }

  ngOnInit() {}

  // Se recarga cada vez que se entra (así se ven los cambios al volver de editar)
  ionViewWillEnter() {
    this.cargando = true;
    this.error = '';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Aviso no válido.';
      this.cargando = false;
      return;
    }

    this.avisosService.getAviso(id).subscribe({
      next: (data) => {
        this.aviso = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando aviso:', err);
        this.error = err.status === 404 ? 'El aviso no existe.' : 'No se pudo cargar el aviso.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Muestra "Editado…" si alguien lo editó (queda registrado quién),
  // o en avisos antiguos si la fecha de edición es de otro día que la publicación
  fueEditado(aviso: Aviso): boolean {
    if (aviso.editado_por_nombre) return true;
    if (!aviso.fecha_edicion) return false;
    return aviso.fecha_edicion.slice(0, 10) !== aviso.fecha_publicacion;
  }
}
