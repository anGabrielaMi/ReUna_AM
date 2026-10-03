import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

// Navegación general: secciones del menú aún no construidas -> página "Próximamente"
const proximamente = () => import('./proximamente/proximamente.page').then(m => m.ProximamentePage);

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
    canActivate: [authGuard],   // requiere sesión
    loadComponent: () => import('./publicar-aviso/publicar-aviso.page').then(m => m.PublicarAvisoPage)
  },
  {
    // Editar aviso desde la app (líder): reutiliza el formulario de publicar
    path: 'avisos/:id/editar',
    canActivate: [authGuard],   // requiere sesión
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
  },
  {
    // Consultar documento: solo miembros de comunidades (requiere sesión)
    path: 'documentos',
    canActivate: [authGuard],
    loadComponent: () => import('./documentos/documentos.page').then(m => m.DocumentosPage)
  },
  {
    // Subir documento (líder)
    path: 'documentos/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./subir-documento/subir-documento.page').then(m => m.SubirDocumentoPage)
  },
  {
    // Encuestas de mis comunidades (requiere sesión)
    path: 'encuestas',
    canActivate: [authGuard],
    loadComponent: () => import('./encuestas/encuestas.page').then(m => m.EncuestasPage)
  },
  {
    // Crear encuesta (líder). Debe ir ANTES de 'encuestas/:id', si no "nueva" se toma como id
    path: 'encuestas/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./crear-encuesta/crear-encuesta.page').then(m => m.CrearEncuestaPage)
  },
  {
    // Editar encuesta (líder), solo si nadie ha respondido: reutiliza el formulario de crear
    path: 'encuestas/:id/editar',
    canActivate: [authGuard],
    loadComponent: () => import('./crear-encuesta/crear-encuesta.page').then(m => m.CrearEncuestaPage)
  },
  {
    // Responder encuesta
    path: 'encuestas/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./responder-encuesta/responder-encuesta.page').then(m => m.ResponderEncuestaPage)
  },
  // Secciones pendientes (cuando se construyan, se cambia loadComponent por la página real)
  { path: 'historico',  loadComponent: proximamente, data: { titulo: 'Histórico' } },
  { path: 'ayuda',      loadComponent: proximamente, data: { titulo: 'Ayuda' } },
  // Cualquier dirección que no exista vuelve a Home
  { path: '**', redirectTo: 'home' }
];