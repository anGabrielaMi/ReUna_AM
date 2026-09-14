import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { SideMenuComponent } from './shared/side-menu/side-menu.component'; // ajusta la ruta según tu carpeta

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet,
    SideMenuComponent   // <-- aquí lo agregas
  ]
})
export class AppComponent {}
