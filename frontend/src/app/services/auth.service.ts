import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api'; // base de tu backend

  constructor(private http: HttpClient) {}

  // 🔹 Login
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/token/`, {
      username: username,
      password: password
    });
  }

  // 🔹 Registro
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register/`, {
      username: username,
      email: email,
      password: password
    });
  }

  // 🔹 Solicitar recuperación de contraseña (envía correo con enlace)
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/password-reset/`, { email });
  }

  // 🔹 Confirmar recuperación con uid + token (vienen del enlace del correo) y nueva contraseña
  confirmPasswordReset(uid: string, token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/password-reset-confirm/`, {
      uid,
      token,
      new_password: newPassword
    });
  }
}