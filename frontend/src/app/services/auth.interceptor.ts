import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SesionService } from './sesion.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private http: HttpClient, private sesion: SesionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Login y refresh van sin token y sin esta lógica (evita reintentos en bucle)
    if (req.url.includes('/api/token/')) {
      return next.handle(req);
    }

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
        // Solo actuamos si mandamos un token y el backend lo rechazó (401)
        if (error.status !== 401 || !token) {
          return throwError(() => error);
        }

        const refresh = localStorage.getItem('refresh');
        if (!refresh) {
          // Token viejo sin refresh: se descarta y se reintenta como visitante
          return this.reintentarSinSesion(req, next);
        }

        // Pedir nuevo access usando refresh (null si el refresh también venció)
        const nuevoAccess$ = this.http
          .post<any>('http://127.0.0.1:8000/api/token/refresh/', { refresh })
          .pipe(
            map((res) => res.access as string),
            catchError(() => of(null))
          );

        return nuevoAccess$.pipe(
          switchMap((access) => {
            if (!access) {
              // Refresh vencido → sesión vencida, se reintenta como visitante
              return this.reintentarSinSesion(req, next);
            }

            localStorage.setItem('access', access);
            // Reintentar la petición original con el nuevo token
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${access}`
              }
            });
            return next.handle(newReq).pipe(
              catchError((err2: HttpErrorResponse) => {
                // El token renovado tampoco sirve (ej: usuario borrado) → visitante
                if (err2.status === 401) {
                  return this.reintentarSinSesion(req, next);
                }
                return throwError(() => err2);
              })
            );
          })
        );
      })
    );
  }

  // Borra los tokens que no sirven y repite la petición sin Authorization.
  // Si el endpoint es público (ej: avisos sin comunidad) responde normal;
  // si exige sesión, recién ahí se manda al login.
  private reintentarSinSesion(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Cierra la sesión (el menú deja de mostrar al usuario)
    this.sesion.cerrar();
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403) {
          window.location.href = '/login';
        }
        return throwError(() => err);
      })
    );
  }
}
