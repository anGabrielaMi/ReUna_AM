import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonButton, IonInput, IonLabel, IonText
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonButton, IonInput, IonLabel, IonText,
    CommonModule, FormsModule, RouterLink
  ]
})
export class ResetPasswordPage implements OnInit {
  uid: string = '';
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  mensaje: string = '';
  error: string = '';
  enviando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.uid = this.route.snapshot.queryParamMap.get('uid') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.uid || !this.token) {
      this.error = 'El enlace de recuperación es inválido o está incompleto.';
    }
  }

  confirmar() {
    this.error = '';
    this.mensaje = '';

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.enviando = true;
    this.authService.confirmPasswordReset(this.uid, this.token, this.newPassword).subscribe({
      next: () => {
        this.mensaje = 'Contraseña actualizada. Ya puedes iniciar sesión.';
        this.enviando = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.error = err?.error?.non_field_errors?.[0]
          || 'No se pudo actualizar la contraseña. Solicita un nuevo enlace.';
        this.enviando = false;
      }
    });
  }
}