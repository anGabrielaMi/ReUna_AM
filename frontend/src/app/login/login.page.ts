import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonButton, IonInput, IonLabel, IonText,
  NavController
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { SesionService } from '../services/sesion.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonButton, IonInput, IonLabel, IonText,
    CommonModule, FormsModule, RouterLink
  ]
})
export class LoginPage {
  username: string = '';
  password: string = '';
  errorMsg: string = '';

  constructor(
    private authService: AuthService,
    private sesion: SesionService,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    // Formulario limpio cada vez que se entra
    this.password = '';
    this.errorMsg = '';
  }

  login() {
    const usuario = this.username.trim();
    this.authService.login(usuario, this.password).subscribe({
      next: (data: any) => {
        // Navegación general: se guarda la sesión (el menú se actualiza solo)
        this.sesion.iniciar(data.access, data.refresh, usuario);
        this.password = '';
        this.errorMsg = '';
        // Criterio: al iniciar sesión, el usuario llega a Home.
        // navigateRoot limpia el historial: "Volver" no regresa al login
        this.navCtrl.navigateRoot('/home');
      },
      error: (err: any) => {
        console.error('Error en login:', err);
        this.errorMsg = 'Credenciales inválidas';
        this.cdr.detectChanges();
      }
    });
  }
}
