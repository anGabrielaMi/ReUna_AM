import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonButton, IonInput, IonLabel, IonText
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonButton, IonInput, IonLabel, IonText,
    CommonModule, FormsModule, RouterLink
  ]
})
export class ForgotPasswordPage implements OnInit {
  email: string = '';
  mensaje: string = '';
  error: string = '';
  enviando: boolean = false;

  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  enviar() {
    this.error = '';
    this.mensaje = '';
    this.enviando = true;

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (res: any) => {
        this.mensaje = res?.detail || 'Revisa tu correo para continuar.';
        this.enviando = false;
      },
      error: () => {
        this.error = 'Ocurrió un error. Intenta nuevamente.';
        this.enviando = false;
      }
    });
  }
}