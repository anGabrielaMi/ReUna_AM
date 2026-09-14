import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private http: HttpClient) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access');

    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si el access expiró (401)
        if (error.status === 401) {
          const refresh = localStorage.getItem('refresh');
          if (refresh) {
            // Pedir nuevo access usando refresh
            return this.http.post<any>('http://127.0.0.1:8000/api/token/refresh/', { refresh }).pipe(
              switchMap((res) => {
                localStorage.setItem('access', res.access);
                // Reintentar la petición original con el nuevo token
                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${res.access}`
                  }
                });
                return next.handle(newReq);
              }),
              catchError(() => {
                // Si también falla el refresh → cerrar sesión
                localStorage.clear();
                window.location.href = '/login';
                return throwError(() => error);
              })
            );
          }
        }
        return throwError(() => error);
      })
    );
  }
}
