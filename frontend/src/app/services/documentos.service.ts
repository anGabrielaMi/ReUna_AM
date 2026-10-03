import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Documento tal como lo entrega GET /api/documentos/
export interface Documento {
  id: number;
  titulo: string;
  nombre_archivo: string;        // ej: 'acta-septiembre.pdf'
  extension: string;             // ej: 'pdf'
  tamano: number | null;         // bytes
  comunidad: number;
  comunidad_nombre: string;
  subido_por_nombre: string | null;
  fecha_subida: string;          // fecha y hora (ISO)
}

// Deben coincidir con EXTENSIONES_PERMITIDAS y TAMANO_MAXIMO_MB en backend/documentos/models.py
export const EXTENSIONES_DOCUMENTO = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
export const TAMANO_MAXIMO_MB = 10;

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private apiUrl = 'http://127.0.0.1:8000/api/documentos/';

  constructor(private http: HttpClient) {}

  // Consultar documento: documentos de mis comunidades (más recientes primero)
  getDocumentos(comunidad?: number | null): Observable<Documento[]> {
    let params = new HttpParams();
    if (comunidad) params = params.set('comunidad', comunidad);
    return this.http.get<Documento[]>(this.apiUrl, { params });
  }

  // Subir documento (líder). Se envía como formulario con archivo (multipart),
  // por eso se usa FormData en vez de JSON
  subirDocumento(titulo: string, archivo: File, comunidad: number | null): Observable<Documento> {
    const datos = new FormData();
    datos.append('titulo', titulo);
    datos.append('archivo', archivo, archivo.name);
    if (comunidad) datos.append('comunidad', String(comunidad));
    return this.http.post<Documento>(this.apiUrl, datos);
  }

  // Descarga el archivo con el token de la sesión (el backend revisa que seas miembro)
  descargar(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${id}/descargar/`, { responseType: 'blob' });
  }
}
