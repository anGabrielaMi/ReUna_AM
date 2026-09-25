import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonButton, IonInput, IonLabel, IonText
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonButton, IonInput, IonLabel, IonText,
    CommonModule, FormsModule
  ]
})
export class LoginPage implements OnInit {
  email: string = '';
  username: string = '';
  password: string = '';
  errorMsg: string = '';
  successMsg: string = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('LoginPage inicializado');
  }

  login() {
    this.authService.login(this.username || this.email, this.password).subscribe({
      next: (data: any) => {
        console.log('Login exitoso:', data);
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);

        // Redirección según rol o por defecto a comunidades
        if (data.rol) {
          localStorage.setItem('rol', data.rol);
          if (data.rol === 'Cliente') {
            this.router.navigate(['/home']);
          } else if (data.rol === 'Administrador') {
            this.router.navigate(['/admin']);
          } else {
            this.errorMsg = 'Rol desconocido.';
          }
        } else {
          this.router.navigate(['/home']); //  >> flujo normal
        }

        // Mensaje de éxito
        this.successMsg = 'Login correcto 🎉';
        this.errorMsg = '';
        this.cdr.detectChanges();

        // Limpiar automáticamente después de 3 segundos
        setTimeout(() => {
          this.successMsg = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        console.error('Error en login:', err);
        this.errorMsg = 'Credenciales inválidas';
        this.successMsg = '';
        this.cdr.detectChanges();
      }
    });
  }
}
