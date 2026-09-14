import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AvisosService {
  private apiUrl = 'http://127.0.0.1:8000/api/avisos/';

  constructor(private http: HttpClient) {}

  getAvisos(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(this.apiUrl);
  }
}
