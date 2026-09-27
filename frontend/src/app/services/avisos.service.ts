import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;   // 'YYYY-MM-DD'
  categoria: string;           // valor interno, ej: 'evento'
  categoria_display: string;   // texto visible, ej: 'Evento'
  fecha_edicion: string;       // fecha y hora de la última edición (ISO)
  comunidad: number | null;    // id de la comunidad (null = aviso de plataforma)
  comunidad_nombre: string;    // nombre visible del origen, ej: 'Comunidad Los Aromos' o 'Reúna'
}

// Datos para publicar un aviso (Publicar aviso – líder)
export interface NuevoAviso {
  titulo: string;
  contenido: string;
  categoria: string;
  comunidad: number | null;   // null = el backend asigna la única comunidad del líder
}

export interface FiltrosAvisos {
  categoria?: string;
  desde?: string;   // 'YYYY-MM-DD'
  hasta?: string;   // 'YYYY-MM-DD'
}

// Deben coincidir con Aviso.CATEGORIAS en backend/avisos/models.py
export const CATEGORIAS_AVISO = [
  { valor: 'reunion', nombre: 'Reunión' },
  { valor: 'evento', nombre: 'Evento' },
  { valor: 'comunicado', nombre: 'Comunicado' },
  { valor: 'encuesta', nombre: 'Encuesta' },
  { valor: 'urgente', nombre: 'Urgente' },
  { valor: 'general', nombre: 'General' },
];

@Injectable({
  providedIn: 'root'
})
export class AvisosService {
  private apiUrl = 'http://127.0.0.1:8000/api/avisos/';

  constructor(private http: HttpClient) {}

  // Criterio 1 + 3: lista ordenada por fecha, con filtros opcionales
  getAvisos(filtros: FiltrosAvisos = {}): Observable<Aviso[]> {
    let params = new HttpParams();
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    return this.http.get<Aviso[]>(this.apiUrl, { params });
  }

  // Criterio 2: un aviso con su contenido completo
  getAviso(id: number): Observable<Aviso> {
    return this.http.get<Aviso>(`${this.apiUrl}${id}/`);
  }

  // Publicar aviso: solo líderes (en su comunidad) y administradores
  crearAviso(aviso: NuevoAviso): Observable<Aviso> {
    return this.http.post<Aviso>(this.apiUrl, aviso);
  }
}
