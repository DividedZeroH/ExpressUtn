# Contexto del Proyecto para el Agente de IA

Este documento resume la arquitectura del proyecto, la estructura actual del código y el estado del desarrollo tras la última sesión de trabajo. Copia y pega este contenido al iniciar una conversación con otro agente.

---

## 1. Información General del Proyecto
* **Nombre:** Sistema de Gestión de Bar (ExpressUtn)
* **Tecnologías:** Node.js (ES Modules), Express, Sequelize ORM, AdminJS (panel de administración), PostgreSQL (corriendo en Docker).
* **Repositorio de GitHub:** [https://github.com/DividedZeroH/ExpressUtn](https://github.com/DividedZeroH/ExpressUtn) (Rama activa: `main`).

---

## 2. Arquitectura de Datos y Modelos (Sequelize)
El sistema gestiona la venta de tragos en barras físicas mediante los siguientes modelos en `app/src/models/`:
1. **`Barra`** (`barra.js`): Mapea a la tabla `barras`. Registra `numero_barra` y `sector`. Convierte a mayúsculas el sector antes de guardar.
2. **`Bebida`** (`bebida.js`): Mapea a la tabla `bebidas`. Registra `nombre`, `precio` y `descripcion`. Nota: el atributo `stock` está comentado en este modelo para un ejercicio práctico de la clase.
3. **`Venta`** (`venta.js`): Mapea a la tabla `ventas`. Registra `numero_venta`, `fecha` (DATEONLY), `hora` (TIME) y `total`.
4. **`DetalleVenta`** (`detalleventa.js`): Tabla intermedia para la venta de bebidas en barras. Registra `venta_id`, `bebida_id`, `barra_id`, `cantidad` y `subtotal`.
5. **Inicializador (`index.js`)**: Levanta la conexión con la DB y configura las asociaciones de clave foránea (`belongsTo` y `hasMany`) entre los modelos.

---

## 3. Estado de la Base de Datos y Seguridad (Últimos Cambios)
* **Seguridad de Credenciales:**
  * Se configuró el archivo `.gitignore` en la raíz para ignorar todos los archivos de variables de entorno (`.env`, `.env.db`, `*.env.db`, `.env*`).
  * El archivo `app/.env.db` fue removido del rastreo de Git (untrack/delete en GitHub) y permanece solo en local.
  * Se actualizaron las credenciales locales a valores de desarrollo seguros:
    * `POSTGRES_DB=bar_db`
    * `POSTGRES_USER=bar_user`
    * `POSTGRES_PASSWORD=secure_local_password_99`
    * `ADMIN_EMAIL=admin@barexpress.utn`
    * `ADMIN_PASSWORD=admin_utn_pass_123`
* **Conexión de Red:**
  * En local corre bajo el puerto **5433** (mapeado al 5432 del contenedor Docker) para evitar colisiones con instancias nativas de Postgres.

---

## 4. Estado de las Migraciones y Resolución de Errores
* **El Problema Inicial:** Al correr `npx sequelize-cli db:migrate`, arrojaba el error `ERROR: relation "public.bebida" does not exist`.
* **Causa:** El commit `a291e99` de la cátedra eliminó a propósito las migraciones iniciales (`001-initial.js` y `002-sessions.js`) para realizar un ejercicio práctico en clase. La base de datos estaba vacía, por lo que no existía la tabla `bebidas` al intentar agregar la columna `stock`.
* **Solución Aplicada:**
  1. Se recuperó la migración inicial del historial de Git y se guardó en `app/src/migrations/20260619234848-inicial.js` para recrear las tablas principales.
  2. Se configuró la migración incremental del stock (`agregar-stock-bebidas`) para referenciar a la tabla correcta en plural (`bebidas`).
  3. Los archivos locales de los modelos en `app/src/models/` fueron comentados minuciosamente para explicar cada tipo de dato y hook sin alterar su comportamiento operativo.

---

## 5. Documentación en la carpeta `docs/`
Se creó una carpeta `docs/` que centraliza la documentación y ya fue subida a GitHub:
* `docs/README.md`: Archivo README del proyecto principal.
* `docs/README_Migraciones.md`: Guía de comandos Sequelize y ejemplos de migración.
* `docs/Guia_Migraciones_Sequelize.md` y `.pdf`: Guía técnica detallada paso a paso sobre modelos, mapeo y el flujo de añadir columnas.
* `docs/prompt_maestro_presentacion.md`: Prompt para generar presentaciones sobre ORMs y Sequelize.
* `docs/contexto_para_agente.md`: Este mismo documento.
