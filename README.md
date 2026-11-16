# Sistema de Seguimiento y Trazabilidad de Proyectos de Investigación Docente

Plataforma web para la gestión, control de rondas de revisión y trazabilidad histórica de proyectos de investigación de profesores en la Facultad de Ingeniería, Arquitectura y Diseño (Universidad de Boyacá).

---

## 1. Requisitos Previos en el Equipo

Antes de instalar el proyecto, verifica que el computador cuente con:

* **XAMPP** (con **PHP >= 8.1**, **Apache** y **MySQL / MariaDB**).
* **Composer** (gestor de paquetes para PHP).
* **Node.js (v18 o superior)** y **npm**.
* **Git**.

---

## 2. Ubicación Obligatoria y Clonación del Proyecto

> **IMPORTANTE:** El proyecto **debe** clonarse dentro de la carpeta `htdocs` de XAMPP con el nombre exacto **`GestionInvestigacionUDB`**, ya que el enrutador del backend (`setBasePath`) y las peticiones del frontend apuntan a esa ruta.

Abre una terminal (**CMD** o **PowerShell**) y ejecuta:

```cmd
cd C:\xampp\htdocs
git clone https://github.com/JERGYT/GestionInvestigacionUDB.git
cd GestionInvestigacionUDB
```

---

## 3. Configuración de la Base de Datos (MySQL)

1. Abre el **Panel de Control de XAMPP** e inicia los servicios **Apache** y **MySQL**.
2. Abre tu navegador y entra a **phpMyAdmin**: `http://localhost/phpmyadmin`
3. Ve a la pestaña **SQL** (o **Importar**), carga el script ubicado en:
   ```text
   C:\xampp\htdocs\GestionInvestigacionUDB\back\sql\01_db_investigacion.sql
   ```
4. Ejecuta el script. Esto creará automáticamente la base de datos **`db_investigacion`** con sus 7 tablas (`usuarios`, `lineas_investigacion`, `sublineas_investigacion`, `proyectos`, `proyecto_investigadores`, `historial_trazabilidad`, `evaluaciones_pares`) y los datos semilla de prueba.

**Credenciales por defecto de conexión (`back/ms-proyectos/app/Config/database.php`):**
* **Host:** `localhost` / `127.0.0.1`
* **Base de datos:** `db_investigacion`
* **Usuario:** `root`
* **Contraseña:** *(vacía)*

---

## 4. Instalación del Backend (PHP + Slim 4 + Eloquent)

Dado que la carpeta `vendor/` no se sube a GitHub, debes instalar las dependencias en el equipo local:

1. **Habilitar la extensión `zip` en XAMPP (Paso obligatorio en PCs recién instalados):**
   * En el panel de XAMPP, junto a **Apache**, haz clic en **Config** $\rightarrow$ **PHP (`php.ini`)**.
   * Busca la línea `;extension=zip` y quítale el punto y coma (`;`) para que quede:
     ```ini
     extension=zip
     ```
   * Guarda el archivo (`Ctrl + S`).

2. **Instalar paquetes con Composer:**
   Abre una terminal nueva y ejecuta:
   ```cmd
   cd C:\xampp\htdocs\GestionInvestigacionUDB\back\ms-proyectos
   composer install
   ```

3. **Verificar que la API responde:**
   Abre en el navegador:
   ```text
   http://localhost/GestionInvestigacionUDB/back/ms-proyectos/public/index.php/view/proyectos
   ```
   Debe devolver un arreglo **JSON** con los proyectos cargados desde MySQL.

---

## 5. Instalación y Ejecución del Frontend (React + TypeScript + Vite)

1. Abre una terminal y entra a la carpeta `front`:
   ```cmd
   cd C:\xampp\htdocs\GestionInvestigacionUDB\front
   ```

2. Instala las dependencias de Node (`node_modules/`):
   ```cmd
   npm install
   ```

3. *(Opcional)* Verifica que el archivo `front/.env` contenga la URL del backend:
   ```env
   VITE_API_URL=http://localhost/GestionInvestigacionUDB/back/ms-proyectos/public/index.php/view
   VITE_USE_MOCKS=false
   ```

4. Levanta el servidor de desarrollo:
   ```cmd
   npm run dev
   ```

5. Abre la aplicación en el navegador:
   ```text
   http://localhost:5173/
   ```

---

## 6. Arquitectura y Estructura del Repositorio

```text
GestionInvestigacionUDB/
├── back/
│   ├── ms-proyectos/               # Microservicio REST en PHP
│   │   ├── app/
│   │   │   ├── Config/             # Conexión Capsule / Eloquent ORM
│   │   │   ├── Controllers/        # Controladores HTTP (PSR-7)
│   │   │   ├── Endpoints/          # Rutas Slim 4 agrupadas bajo /view
│   │   │   ├── Middleware/         # Cabeceras CORS
│   │   │   ├── Models/             # Modelos Eloquent de las 7 tablas
│   │   │   └── Repositories/       # Lógica de negocio y transiciones de estado
│   │   ├── public/
│   │   │   └── index.php           # Front Controller de Slim 4
│   │   └── composer.json           # Dependencias (slim/slim, illuminate/database)
│   └── sql/
│       └── 01_db_investigacion.sql # Estructura DDL y datos semilla MySQL
│
└── front/                          # Interfaz Web en React + Vite + TypeScript
    ├── src/
    │   ├── components/             # Sidebar, AdminShell y componentes UI
    │   ├── pages/                  # Vistas de Gestión, Radicación, Comité y Trazabilidad
    │   ├── services/               # Consumo de API REST y datos de respaldo
    │   └── types/                  # Interfaces TypeScript
    └── package.json
```

---

## 7. Perfiles y Usuarios de Prueba (Datos Semilla)

Para demostrar el flujo completo en la sustentación, el sistema cuenta con los siguientes actores precargados en la base de datos:

| Rol en el Flujo | Nombre | Correo Institucional | Contraseña |
| :--- | :--- | :--- | :--- |
| **Líder de Grupo** | Dra. Paula Cheng | `pcheng@uniboyaca.edu.co` | `123456` |
| **Docente Investigador** | Ing. Francisco Vargas | `fvargas@uniboyaca.edu.co` | `123456` |
| **Docente Co-investigador** | Ing. Martha Celene | `mcelene@uniboyaca.edu.co` | `123456` |
| **Comité de Investigaciones** | Comité FIAD | `comite.fiad@uniboyaca.edu.co` | `123456` |
| **Par Evaluador 1** | Dr. Carlos Mendoza | `cmendoza@uniboyaca.edu.co` | `123456` |
| **Par Evaluador 2** | Dra. Laura Gómez | `lgomez@uniboyaca.edu.co` | `123456` |

---

## 8. Solución Rápida de Problemas en el PC de la Universidad

* **Error `The zip extension and unzip/7z commands are both missing` al correr Composer:**
  * Si no tienes permisos para editar `php.ini` en el PC de la universidad, ejecuta:
    ```cmd
    composer install --prefer-source
    ```
* **Apache no inicia en XAMPP (Puerto 80 ocupado):**
  * Detén servicios que usen el puerto 80 (como IIS o Skype) o cambia el puerto de Apache en `httpd.conf` a `8080` y actualiza la URL del backend a `http://localhost:8080/...`.
* **Error 404 al consultar `/view/proyectos`:**
  * Asegúrate de incluir `index.php` en la URL (`.../public/index.php/view/proyectos`), ya que Apache en XAMPP no siempre tiene configurado un `.htaccess` de reescritura en subcarpetas.