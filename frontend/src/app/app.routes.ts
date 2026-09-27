import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'avisos',
    loadComponent: () => import('./avisos/avisos.page').then(m => m.AvisosPage)
  },
  {
    // Publicar aviso (líder). Debe ir ANTES de 'avisos/:id', si no "nuevo" se toma como id
    path: 'avisos/nuevo',
    loadComponent: () => import('./publicar-aviso/publicar-aviso.page').then(m => m.PublicarAvisoPage)
  },
  {
    // Criterio 2: detalle de un aviso
    path: 'avisos/:id',
    loadComponent: () => import('./aviso-detalle/aviso-detalle.page').then(m => m.AvisoDetallePage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
  {
    // NUEVO: pantalla para solicitar el correo de recuperación
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    // NUEVO: pantalla donde se ingresa la nueva contraseña (uid y token llegan por query params)
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  }
  // otras rutas...
];