import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  IonMenu,
  IonMenuToggle,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  NavController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  notificationsOutline,
  calendarOutline,
  helpCircleOutline,
  documentTextOutline,
  informationCircleOutline,
  personCircleOutline,
  logInOutline,
  logOutOutline,
  personAddOutline
} from 'ionicons/icons';

import { SesionService } from './services/sesion.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet,
    IonSplitPane,
    IonMenu,
    IonMenuToggle,
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
  // Secciones del menú. Las que aún no existen muestran "Próximamente" (ver app.routes.ts)
  secciones = [
    { nombre: 'Home',       ruta: '/home',       icono: 'home-outline' },
    { nombre: 'Avisos',     ruta: '/avisos',     icono: 'notifications-outline' },
    { nombre: 'Histórico',  ruta: '/historico',  icono: 'calendar-outline' },
    { nombre: 'Encuestas',  ruta: '/encuestas',  icono: 'help-circle-outline' },
    { nombre: 'Documentos', ruta: '/documentos', icono: 'document-text-outline' },
    { nombre: 'Ayuda',      ruta: '/ayuda',      icono: 'information-circle-outline' },
  ];

  constructor(
    public sesion: SesionService,
    private navCtrl: NavController
  ) {
    // Íconos del menú lateral: en componentes standalone hay que registrarlos
    // con addIcons, si no Ionic no los encuentra y no se dibujan
    addIcons({
      homeOutline,
      notificationsOutline,
      calendarOutline,
      helpCircleOutline,
      documentTextOutline,
      informationCircleOutline,
      personCircleOutline,
      logInOutline,
      logOutOutline,
      personAddOutline
    });
  }

  // Cerrar sesión: borra la sesión y vuelve a Home (navigateRoot limpia el historial,
  // así "Volver" no regresa a pantallas de la sesión anterior)
  cerrarSesion() {
    this.sesion.cerrar();
    this.navCtrl.navigateRoot('/home');
  }
}
