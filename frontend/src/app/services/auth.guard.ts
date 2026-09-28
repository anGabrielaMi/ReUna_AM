import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

/**
 * Navegación general – páginas que requieren sesión.
 * Si no hay sesión, lleva a Iniciar sesión en vez de mostrar la página.
 */
export const authGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return sesion.logueado() ? true : router.createUrlTree(['/login']);
};
