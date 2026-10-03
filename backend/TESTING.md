# Guía para ejecutar las pruebas automáticas – Proyecto Reúna

Esta guía explica cómo correr las pruebas automáticas del backend (Django) de Reúna, paso a paso, para cualquier persona que revise el proyecto.

---

## 1. ¿Qué son estas pruebas?

Son programas que revisan automáticamente que la API cumpla los criterios de aceptación. Cada prueba simula una acción, por ejemplo "un colaborador intenta subir un documento", y verifica la respuesta esperada (en ese caso, que la API lo rechace).

- **No usan tus datos reales.** Django crea una base de datos temporal solo para las pruebas y la borra al terminar.
- **No necesitas levantar el servidor** ni la app Ionic para correrlas.

---

## 2. Qué se prueba

| App | Archivo | Pruebas | Historia(s) que cubre |
|---|---|---|---|
| documentos | `backend/documentos/tests.py` | 16 | Subir documento, Consultar documento |
| comunidades | `backend/comunidades/tests.py` | 6 | Seguridad de comunidades, rol por comunidad |
| avisos | `backend/avisos/tests.py` | 4 | Publicar aviso (permiso de líder) |
| encuestas | `backend/encuestas/tests.py` | 24 | Crear encuesta, Responder encuesta |

### Detalle por prueba

**Subir documento**

| Prueba | Qué verifica |
|---|---|
| `test_lider_sube_documento_a_su_comunidad` | El líder sube un archivo; queda registrado quién lo subió, en qué comunidad y cuándo |
| `test_colaborador_no_puede_subir` | Un colaborador recibe 403 |
| `test_lider_no_puede_subir_a_otra_comunidad` | Un líder no puede subir a una comunidad donde no es líder (403) |
| `test_sin_sesion_no_puede_subir` | Sin sesión, la API rechaza la subida |
| `test_lider_de_varias_debe_elegir_comunidad` | Si es líder de varias comunidades, debe indicar a cuál sube |
| `test_formato_no_permitido` | Un archivo `.exe` es rechazado |
| `test_archivo_demasiado_grande` | Un archivo de más de 10 MB es rechazado |
| `test_titulo_obligatorio` | El título no puede quedar vacío |

**Consultar documento**

| Prueba | Qué verifica |
|---|---|
| `test_miembro_ve_solo_documentos_de_sus_comunidades` | Cada usuario ve solo los documentos de sus comunidades |
| `test_admin_ve_todos` | El administrador ve los documentos de todas las comunidades |
| `test_mas_recientes_primero` | La lista muestra primero los más recientes |
| `test_lista_muestra_datos_del_documento` | Cada documento muestra comunidad, quién lo subió, formato y fecha |
| `test_sin_sesion_no_ve_documentos` | Sin sesión no se ve la lista |
| `test_miembro_descarga_documento` | Un miembro de la comunidad descarga el archivo |
| `test_no_miembro_no_puede_descargar` | Alguien de otra comunidad no puede descargarlo |
| `test_colaborador_no_puede_borrar` | Solo el administrador puede borrar documentos |

**Comunidades (seguridad)**

| Prueba | Qué verifica |
|---|---|
| `test_usuario_no_puede_crear_comunidad` | Un usuario común no puede crear comunidades (403) |
| `test_lider_no_puede_editar_ni_borrar_comunidad` | Un líder no puede editar ni borrar comunidades (403) |
| `test_admin_puede_crear_comunidad` | El administrador sí puede crear comunidades |
| `test_sin_sesion_no_ve_comunidades` | Sin sesión no se ve la lista de comunidades |
| `test_usuario_ve_lista_y_se_une` | Un usuario con sesión se une a una comunidad y queda como colaborador |
| `test_mias_devuelve_rol` | `/api/comunidades/mias/` devuelve el rol del usuario en cada comunidad |

**Publicar aviso**

| Prueba | Qué verifica |
|---|---|
| `test_lider_publica_y_se_asocia_a_su_comunidad` | El aviso queda asociado automáticamente a la comunidad del líder |
| `test_colaborador_no_puede_publicar` | Un colaborador recibe 403 |
| `test_lider_no_publica_en_otra_comunidad` | Un líder no publica donde no es líder (403) |
| `test_lider_de_varias_debe_elegir` | Si es líder de varias comunidades, debe elegir a cuál publica |

**Crear encuesta**

| Prueba | Qué verifica |
|---|---|
| `test_lider_crea_encuesta_en_su_comunidad` | El líder crea una encuesta con preguntas y alternativas; queda asociada a su comunidad |
| `test_colaborador_no_puede_crear` | Un colaborador recibe 403 |
| `test_lider_no_puede_crear_en_otra_comunidad` | Un líder no crea encuestas donde no es líder (403) |
| `test_lider_de_varias_debe_elegir_comunidad` | Si es líder de varias comunidades, debe elegir una |
| `test_sin_preguntas_no_se_crea` | Una encuesta sin preguntas es rechazada |
| `test_maximo_5_preguntas` | Se aceptan 5 preguntas; 6 son rechazadas |
| `test_minimo_2_alternativas` | Una pregunta con 1 alternativa es rechazada |
| `test_maximo_5_alternativas` | Una pregunta con 6 alternativas es rechazada |
| `test_alternativas_repetidas_no_se_aceptan` | No se aceptan alternativas repetidas en una pregunta |
| `test_fecha_cierre_debe_ser_futura` | La fecha de cierre debe ser posterior a ahora |
| `test_titulo_obligatorio` | El título no puede quedar vacío |
| `test_lider_edita_si_nadie_respondio` | El líder puede editar mientras nadie haya respondido |
| `test_no_se_edita_si_alguien_respondio` | Si alguien ya respondió, no se puede editar |
| `test_colaborador_no_puede_editar` | Un colaborador no puede editar (403) |
| `test_puede_editar_en_la_respuesta` | La API indica a la app si mostrar el botón "Editar" |

**Responder encuesta**

| Prueba | Qué verifica |
|---|---|
| `test_miembro_ve_encuestas_de_su_comunidad` | Cada usuario ve solo las encuestas de sus comunidades |
| `test_colaborador_responde` | Un miembro responde; queda marcada como "Respondida" |
| `test_responde_una_sola_vez` | Un usuario no puede responder dos veces |
| `test_debe_responder_todas_las_preguntas` | No se acepta una respuesta incompleta |
| `test_alternativa_de_otra_pregunta_no_vale` | No se acepta una alternativa que no corresponde a la pregunta |
| `test_no_se_responde_despues_del_cierre` | Después de la fecha de cierre no se puede responder |
| `test_usuario_de_otra_comunidad_no_puede_responder` | Alguien de otra comunidad no puede responder |
| `test_respuestas_son_anonimas` | Las respuestas no guardan el usuario y la API no muestra quién respondió qué |
| `test_estado_abiertas_y_cerradas` | El filtro de encuestas abiertas y cerradas funciona |

---

## 3. Requisitos previos

- **Python** 3.12 o superior.
- **PostgreSQL** instalado y en ejecución.
- El proyecto descargado (por ejemplo, clonado desde GitHub).

---

## 4. Preparar el entorno (solo la primera vez)

Todos los comandos se escriben en una terminal (PowerShell en Windows), **dentro de la carpeta `backend`** del proyecto.

### 4.1 Crear y activar un entorno virtual

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

En macOS o Linux, el último comando es `source venv/bin/activate`.

### 4.2 Instalar las dependencias

```powershell
pip install -r requirements.txt
```

### 4.3 Crear el archivo `.env`

En la carpeta `backend`, crea un archivo llamado `.env` con los datos de tu PostgreSQL:

```
DB_NAME=reuna
DB_USER=tu_usuario
DB_PASSWORD=tu_clave
DB_HOST=localhost
DB_PORT=5432
```

El archivo `.env` no se sube a GitHub porque contiene claves. Cada persona crea el suyo.

### 4.4 Dar permiso para crear la base de datos de pruebas

Django crea una base temporal llamada `test_<nombre>` cada vez que corre las pruebas. Para eso, tu usuario de PostgreSQL necesita permiso para crear bases de datos. En pgAdmin o en `psql`, ejecuta una sola vez:

```sql
ALTER USER tu_usuario CREATEDB;
```

---

## 5. Ejecutar las pruebas

Con el entorno virtual activado, desde la carpeta `backend`:

### Todas las pruebas

```powershell
python manage.py test documentos comunidades avisos encuestas
```

### Una sola app

```powershell
python manage.py test documentos
```

### Una sola prueba

```powershell
python manage.py test documentos.tests.DocumentosTests.test_colaborador_no_puede_subir
```

### Con el detalle de cada prueba

Agrega `-v 2` para ver el nombre y el resultado de cada prueba:

```powershell
python manage.py test documentos comunidades avisos encuestas -v 2
```

---

## 6. Cómo leer el resultado

Si todo está bien, al final aparece:

```
Ran 50 tests in 12.345s

OK
```

Si algo falla, aparece `FAILED (failures=1)` o `FAILED (errors=1)`, y más arriba el nombre de la prueba que falló:

- **FAIL:** la prueba corrió, pero el resultado no fue el esperado. Por ejemplo, se esperaba un 403 y la API respondió 201. Es una señal de que un criterio de aceptación no se está cumpliendo.
- **ERROR:** la prueba no pudo terminar por un problema en el código o en la configuración (un import que falta, una tabla que no existe, etc.).

---

## 7. Guardar la evidencia en un archivo

Para dejar registro de la ejecución, guarda la salida en un archivo de texto:

```powershell
python manage.py test documentos comunidades avisos encuestas -v 2 > pruebas_sprint8.txt 2>&1
```

El archivo `pruebas_sprint8.txt` queda en la carpeta donde estás. Para guardarlo en otra carpeta, escribe la ruta completa, por ejemplo:

```powershell
python manage.py test documentos comunidades avisos encuestas -v 2 > "C:\Users\TU_USUARIO\Desktop\pruebas_sprint8.txt" 2>&1
```

Una captura de pantalla de la terminal mostrando `Ran 50 tests ... OK` también sirve como evidencia.

---

## 8. Problemas frecuentes

| Mensaje | Causa | Solución |
|---|---|---|
| `permission denied to create database` | El usuario de PostgreSQL no puede crear la base de pruebas | Paso 4.4: `ALTER USER tu_usuario CREATEDB;` |
| `database "test_reuna" already exists` | Una ejecución anterior se interrumpió | Responde `yes` cuando Django pregunte si la borra, o agrega `--noinput` |
| `UndefinedValueError: DB_NAME not found` | Falta el archivo `.env` o una de sus claves | Paso 4.3 |
| `could not connect to server` | PostgreSQL no está en ejecución, o el host o el puerto no coinciden | Inicia PostgreSQL y revisa `DB_HOST` y `DB_PORT` |
| `ModuleNotFoundError: No module named 'django'` | El entorno virtual no está activado | Paso 4.1 (activar) |
| `No module named 'rest_framework_simplejwt'` | Faltan dependencias | Paso 4.2 |

---

## 9. Pruebas manuales en la app (complemento)

Las pruebas automáticas revisan la API. Para revisar las pantallas:

1. Levanta el backend: `python manage.py runserver`
2. En otra terminal, desde la carpeta `frontend`: `ionic serve`
3. En el admin de Django (`http://127.0.0.1:8000/admin/`), crea una comunidad con un líder y un colaborador.
4. Inicia sesión en la app como líder, entra a **Documentos** y sube un archivo.
5. Inicia sesión como colaborador y verifica que ve el documento, puede descargarlo y **no** ve el botón "Subir documento".
6. Como líder, entra a **Encuestas** → **Crear encuesta**, agrega preguntas y alternativas, y una fecha de cierre.
7. Como colaborador, responde la encuesta: debe quedar marcada como "Respondida" y no se puede responder de nuevo.
8. Como líder, verifica que la encuesta ya no muestra la opción "Editar".
