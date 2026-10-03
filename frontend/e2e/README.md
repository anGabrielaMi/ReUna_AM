# Guía: pruebas automatizadas con video (Playwright) – Reúna

Pruebas de aceptación que recorren las historias de usuario en la app real, verifican cada criterio y graban un video con letreros que explican qué se está probando.

Historias cubiertas por ahora: **Publicar aviso** (7 criterios, 6 pruebas).

---

## 1. Instalación (solo la primera vez)

En PowerShell:

```
cd "C:\Users\davia\Desktop\Reuna v_2\frontend"
npm i -D @playwright/test
npx playwright install chromium
```

- La primera línea agrega Playwright al proyecto (actualiza `package.json`).
- La segunda descarga el navegador que usan las pruebas (~150 MB).

---

## 2. Cada vez que quieras correr las pruebas

Se necesitan **tres terminales** abiertas.

**Terminal 1 – Backend**

```
cd "C:\Users\davia\Desktop\Reuna v_2\backend"
python manage.py seed_demo
python manage.py runserver
```

`seed_demo` deja los datos de prueba siempre iguales y borra los avisos que dejaron pruebas anteriores (los que empiezan con "[Demo]").

**Terminal 2 – Frontend**

```
cd "C:\Users\davia\Desktop\Reuna v_2\frontend"
ionic serve
```

**Terminal 3 – Pruebas**

```
cd "C:\Users\davia\Desktop\Reuna v_2\frontend"
npx playwright test
npx playwright show-report
```

- `npx playwright test` corre las pruebas y graba los videos (~1 min y medio).
- `npx playwright show-report` abre el informe en el navegador: cada prueba en verde o rojo, con su video, capturas y el paso a paso ("trace").

Los videos quedan en `frontend/test-results/` (un `video.webm` por prueba). Esa carpeta no se sube a GitHub.

---

## 3. Usuarios de prueba

Los crea `python manage.py seed_demo`. Todos usan la clave **`demo12345`**.

| Usuario | Rol |
|---|---|
| `demo_lider` | Líder de Demo Los Aromos |
| `demo_multi` | Líder de Demo Los Aromos y de Demo El Roble |
| `demo_colab` | Colaborador de Demo Los Aromos |
| `demo_roble` | Colaborador de Demo El Roble |

Son solo para pruebas; no uses estas claves en datos reales.

---

## 4. Velocidad

**Grabar más lento** (Playwright espera más entre cada acción). En la Terminal 3:

```
$env:E2E_SLOWMO=1000; npx playwright test
```

| Valor | Resultado |
|---|---|
| 600 | Normal (el que viene configurado) |
| 1000 | Un segundo entre acciones |
| 1500 | Bien pausado |

El ajuste dura mientras esa ventana de PowerShell esté abierta; en una ventana nueva vuelve a 600.

**Ver más lento un video que ya existe**: no hace falta regrabar, usa la velocidad del reproductor.

- VLC: *Reproducción → Velocidad → Más lento*
- Navegador o reproductor de Windows: ícono de velocidad (0.5x o 0.75x)

---

## 5. Qué prueba cada test (Publicar aviso)

| Prueba | Criterio |
|---|---|
| El líder publica eligiendo la categoría | 3, 4 y 5: aparece en la lista, elige categoría, se asocia a su comunidad |
| El aviso muestra título, contenido y fecha | 1 |
| Visible para colaboradores de la comunidad (y no para otras) | 2 |
| Líder de varias comunidades elige a cuál va | 5 |
| Líder no puede publicar donde no es líder (API: 403) | 6 |
| Colaborador no puede publicar (sin botón, formulario bloqueado, API: 403) | 7 |

---

## 6. Archivos

| Archivo | Para qué sirve |
|---|---|
| `backend/avisos/management/commands/seed_demo.py` | Crea los datos de prueba |
| `frontend/playwright.config.ts` | Configuración: video, capturas, cámara lenta, informe |
| `frontend/e2e/helpers.ts` | Funciones reutilizables: iniciar sesión, letreros en pantalla, llamadas a la API |
| `frontend/e2e/publicar-aviso.spec.ts` | Las pruebas de "Publicar aviso" |

Para agregar otra historia, se crea un archivo nuevo en `frontend/e2e/` (por ejemplo `editar-aviso.spec.ts`) usando las mismas funciones de `helpers.ts`.

---

## 7. Si algo falla

| Problema | Qué revisar |
|---|---|
| Las pruebas no encuentran la página | ¿Está corriendo `ionic serve` en `localhost:8100`? |
| Errores al iniciar sesión o "No existe la comunidad" | ¿Corriste `python manage.py seed_demo` y está corriendo `runserver`? |
| `Executable doesn't exist` | Falta `npx playwright install chromium` |
| Una prueba sale en rojo | Abre `npx playwright show-report`, entra a la prueba y mira el video y el paso donde falló |
