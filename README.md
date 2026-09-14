

# Reúna

Aplicación comunitaria desarrollada con **Ionic/Angular** en el frontend y **Django** en el backend.  
Utiliza **PostgreSQL** como base de datos principal para registro, login y gestión de información.  
Se proyecta la integración con **Google Drive API** para almacenamiento y consulta de documentos.  


---

## Estructura del proyecto

- **Frontend (Ionic/Angular)**
  - `src/` → componentes y páginas
  - `shared/` → menú lateral y elementos comunes
  - Integración con API REST del backend

- **Backend (Django)**
  - `reuna/` → configuración principal
  - `apps/` → módulos de negocio
  - Autenticación JWT y roles
  - Panel admin habilitado

- **Base de datos**
  - Producción y desarrollo: **PostgreSQL**

- **APIs externas (planificadas)**
  - [Google Drive API](https://developers.google.com/drive) para gestión de documentos comunitarios

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
`


