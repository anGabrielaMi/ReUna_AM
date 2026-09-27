import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  calendarOutline,
  helpCircleOutline,
  documentTextOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {
    // Íconos del menú lateral: en componentes standalone hay que registrarlos
    // con addIcons, si no Ionic no los encuentra y no se dibujan
    addIcons({
      notificationsOutline,
      calendarOutline,
      helpCircleOutline,
      documentTextOutline,
      informationCircleOutline
    });
  }
}
