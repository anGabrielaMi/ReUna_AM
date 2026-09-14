import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonButton,
  IonIcon,
  IonList,       // 👈 añadido
  IonLabel       // 👈 añadido
} from '@ionic/angular';

import { AvisosService, Aviso } from '../services/avisos.service';

@Component({
  selector: 'app-avisos',
  templateUrl: './avisos.page.html',
  styleUrls: ['./avisos.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonButton,
    IonIcon,
    IonList,     // 👈 añadido
    IonLabel,    // 👈 añadido
    CommonModule,
    FormsModule
  ]
})
export class AvisosPage implements OnInit {
  avisos: Aviso[] = [];

  constructor(
    private avisosService: AvisosService,
    private cdr: ChangeDetectorRef   // 👈 añadido
  ) {}

  ngOnInit() {
    console.log('AvisosPage inicializado');
    this.loadAvisos();
  }

  loadAvisos() {
    this.avisosService.getAvisos().subscribe({
      next: (data: Aviso[]) => {
        console.log('Avisos recibidos:', data);
        this.avisos = data;
        this.cdr.detectChanges();   // 👈 añadido
      },
      error: (err: any) => console.error('Error cargando avisos:', err)
    });
  }
}