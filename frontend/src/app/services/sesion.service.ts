import { Injectable, signal, computed } from '@angular/core';

/**
 * Navegación general – estado de la sesión del usuario.
 * Un solo lugar para saber si hay sesión y con qué usuario, así el menú,
 * Home y el guard se actualizan solos al iniciar o cerrar sesión.
 */
@Injectable({
  providedIn: 'root'
})
export class SesionService {
  // Nombre de usuario de la sesión actual (null = sin sesión)
  private _usuario = signal<string | null>(this.leer('username'));
  private _hayToken = signal<boolean>(!!this.leer('access'));

  readonly usuario = this._usuario.asReadonly();
  readonly logueado = computed(() => this._hayToken());

  // Llamar después de un login correcto
  iniciar(access: string, refresh: string, username: string) {
    this.guardar('access', access);
    this.guardar('refresh', refresh);
    this.guardar('username', username);
    this._usuario.set(username);
    this._hayToken.set(true);
  }

  // Cerrar sesión (también la usa el interceptor cuando el token ya no sirve)
  cerrar() {
    for (const clave of ['access', 'refresh', 'username', 'rol']) {
      try { localStorage.removeItem(clave); } catch { /* sin acceso a storage */ }
    }
    this._usuario.set(null);
    this._hayToken.set(false);
  }

  private leer(clave: string): string | null {
    try { return localStorage.getItem(clave); } catch { return null; }
  }

  private guardar(clave: string, valor: string) {
    try { localStorage.setItem(clave, valor); } catch { /* sin acceso a storage */ }
  }
}
