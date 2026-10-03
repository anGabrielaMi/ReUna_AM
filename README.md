

# Reúna

Aplicación comunitaria desarrollada con **Ionic/Angular** en el frontend y **Django** en el backend.  
Utiliza **PostgreSQL** como base de datos principal para registro, login y gestión de información.  
Los líderes de cada comunidad pueden subir documentos, que se guardan en el servidor y se consultan a través de la API REST.  


---

## Estructura del proyecto

- **Frontend (Ionic/Angular)**
  - `src/` → componentes y páginas
  - `shared/` → menú lateral y elementos comunes
  - Integración con API REST del backend

- **Backend (Django)**
  - `reuna/` → configuración principal
  - `apps/` → módulos de negocio
  - Autenticación JWT y roles (colaborador y líder por comunidad, administrador)
  - `media/` → documentos subidos por los líderes (no se sube a GitHub)
  - Panel admin habilitado

- **Base de datos**
  - Producción y desarrollo: **PostgreSQL**

- **Documentos**
  - Se guardan en el servidor (`backend/media/`) con `FileField` de Django
  - Se descargan por `/api/documentos/<id>/descargar/`, que solo permite el acceso a miembros de la comunidad

---

## Instalación y ejecución

### Backend (Django)
```
# Crear entorno virtual
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Instalar dependencias
pip install -r requirements.txt

# Migraciones
python manage.py migrate

# Ejecutar servidor
python manage.py runserver
----
```
### Frontend (Ionic/Angular)
```
# Instalar dependencias
npm install

# Ejecutar en desarrollo
ionic serve
```

---

## Pruebas automáticas

El backend tiene pruebas automáticas de la API (documentos, comunidades, avisos y encuestas).
Desde la carpeta `backend`:

```
python manage.py test documentos comunidades avisos encuestas
```

La guía completa (preparación, qué se prueba, cómo leer el resultado y problemas frecuentes) está en [`backend/TESTING.md`](backend/TESTING.md).
