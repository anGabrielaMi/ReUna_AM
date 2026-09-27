import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Comunidad del usuario con su rol en ella (GET /api/comunidades/mias/)
export interface MiComunidad {
  id: number;
  nombre: string;
  rol: 'colaborador' | 'lider';
}

@Injectable({
  providedIn: 'root'
})
export class ComunidadService {
  private apiUrl = 'http://127.0.0.1:8000/api/comunidades/';

  constructor(private http: HttpClient) {}

  getComunidades() {
    return this.http.get<any[]>(this.apiUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    });
  }

  // Publicar aviso: comunidades del usuario con su rol (el token lo agrega el interceptor)
  getMisComunidades(): Observable<MiComunidad[]> {
    return this.http.get<MiComunidad[]>(`${this.apiUrl}mias/`);
  }

  unirseComunidad(id: number) {
    return this.http.post(`${this.apiUrl}${id}/unirse/`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    });
  }

  salirComunidad(id: number) {
    return this.http.post(`${this.apiUrl}${id}/salir/`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    });
  }
}
