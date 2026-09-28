import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonText
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonText,
    CommonModule, FormsModule, RouterLink
  ]
})
export class RegisterPage {
  username = '';
  email = '';
  password = '';
  errorMsg = '';
  successMsg = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: res => {
        this.successMsg = 'Usuario registrado correctamente 🎉';
        this.errorMsg = '';
        setTimeout(() => this.successMsg = '', 3000);
        this.router.navigate(['/login']);
      },
      error: err => {
        this.errorMsg = this.extraerMensajeError(err);
        this.successMsg = '';
      }
    });
  }

  private extraerMensajeError(err: any): string {
    const data = err?.error;

    if (!data) {
      return 'Error al registrar usuario';
    }

    // DRF devuelve algo como { "email": ["This field is required."], "username": [...] }
    // Tomamos el primer campo con error y su primer mensaje.
    const primerCampo = Object.keys(data)[0];
    if (primerCampo && Array.isArray(data[primerCampo]) && data[primerCampo].length > 0) {
      const etiquetas: { [key: string]: string } = {
        email: 'Correo',
        username: 'Usuario',
        password: 'Contraseña'
      };
      const nombreCampo = etiquetas[primerCampo] || primerCampo;
      return `${nombreCampo}: ${data[primerCampo][0]}`;
    }

    return 'Error al registrar usuario';
  }
}