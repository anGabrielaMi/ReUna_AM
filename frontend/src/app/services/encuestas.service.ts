import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alternativa {
  id?: number;
  texto: string;
}

export interface Pregunta {
  id?: number;
  texto: string;
  alternativas: Alternativa[];
}

// Encuesta tal como la entrega GET /api/encuestas/
export interface Encuesta {
  id: number;
  titulo: string;
  descripcion: string;
  comunidad: number;
  comunidad_nombre: string;
  creada_por_nombre: string | null;
  fecha_creacion: string;     // ISO
  fecha_cierre: string;       // ISO
  abierta: boolean;           // false = ya pasó la fecha de cierre
  ya_respondi: boolean;       // el usuario actual ya respondió
  puede_editar: boolean;      // líder de la comunidad (o admin) y nadie ha respondido
  preguntas: Pregunta[];
}

// Datos para crear o editar
export interface NuevaEncuesta {
  titulo: string;
  descripcion: string;
  fecha_cierre: string;       // 'YYYY-MM-DDTHH:mm' (hora local)
  comunidad: number | null;   // null = el backend asigna la única comunidad del líder
  preguntas: Pregunta[];
}

export type EstadoEncuestas = '' | 'abiertas' | 'cerradas';

// Deben coincidir con backend/encuestas/models.py
export const LIMITES_ENCUESTA = {
  minPreguntas: 1,
  maxPreguntas: 5,
  minAlternativas: 2,
  maxAlternativas: 5,
};

@Injectable({
  providedIn: 'root'
})
export class EncuestasService {
  private apiUrl = 'http://127.0.0.1:8000/api/encuestas/';

  constructor(private http: HttpClient) {}

  getEncuestas(estado: EstadoEncuestas = ''): Observable<Encuesta[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<Encuesta[]>(this.apiUrl, { params });
  }

  getEncuesta(id: number): Observable<Encuesta> {
    return this.http.get<Encuesta>(`${this.apiUrl}${id}/`);
  }

  // Crear encuesta (líder)
  crearEncuesta(encuesta: NuevaEncuesta): Observable<Encuesta> {
    return this.http.post<Encuesta>(this.apiUrl, encuesta);
  }

  // Editar encuesta (líder), solo si nadie ha respondido
  actualizarEncuesta(id: number, encuesta: NuevaEncuesta): Observable<Encuesta> {
    return this.http.put<Encuesta>(`${this.apiUrl}${id}/`, encuesta);
  }

  // Responder encuesta: una alternativa por pregunta
  responder(id: number, respuestas: { pregunta: number; alternativa: number }[]): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.apiUrl}${id}/responder/`, { respuestas });
  }
}
