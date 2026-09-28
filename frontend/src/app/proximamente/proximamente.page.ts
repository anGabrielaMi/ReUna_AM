import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { constructOutline } from 'ionicons/icons';

// Navegación general: secciones del menú que aún no se construyen.
// Cuando se construya una sección, se cambia su ruta a la página real.
@Component({
  selector: 'app-proximamente',
  templateUrl: './proximamente.page.html',
  styleUrls: ['./proximamente.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon
  ]
})
export class ProximamentePage {
  titulo: string;

  constructor(route: ActivatedRoute) {
    addIcons({ constructOutline });
    // El nombre de la sección viene en la ruta: data: { titulo: 'Encuestas' }
    this.titulo = route.snapshot.data['titulo'] ?? 'Esta sección';
  }
}
