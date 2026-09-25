import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
