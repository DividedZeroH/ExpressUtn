# Bar — Gestión de Ventas

Aplicación web construida con **Express + AdminJS + Sequelize + PostgreSQL**.  
Permite administrar el menú de bebidas, las barras del local y el registro de ventas desde un panel web.

---

## Estructura del proyecto

```
tp_trabajo_express/
├── README.md
└── app/                     # Proyecto Node principal
    ├── src/
    │   ├── app.js               # Entry-point Express
    │   ├── config/database.cjs  # Configuración Sequelize
    │   ├── models/              # Modelos Sequelize (Bebida, Barra, Venta, DetalleVenta)
    │   ├── migrations/          # Migraciones de esquema
    │   ├── seeders/             # Datos de ejemplo
    │   ├── admin/               # Config AdminJS + componentes React (dashboard, top-bar, sidebar)
    │   └── public/              # Landing page + estilos CSS
    ├── Dockerfile
    ├── docker-compose.yml
    ├── .env                     # Variables para ejecución nativa en Windows
    ├── .env.db                  # Variables para ejecución en Docker
    └── package.json
```

---

## Inicio rápido

### 1. Levantar la base de datos

```bash
cd app
docker compose up -d db
```

Esperá a que el contenedor quede `healthy`:

```bash
docker compose ps
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Migrar y sembrar la base de datos

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 4. Iniciar la aplicación

```bash
node src/app.js
```

### 5. Abrir en el navegador

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000` | Página principal |
| `http://localhost:3000/admin` | Panel de administración |

**Credenciales del panel:**
```
Email:    admin@bar.example
Password: admin123
```

---

## Opción alternativa — Todo en Docker

Levanta la base de datos y la aplicación en contenedores:

```bash
cd app
docker compose up -d
```

> El servicio `backend` monta `./src` como volumen; los cambios en el código se reflejan sin reconstruir la imagen.

---

## Comandos útiles

### Docker

```bash
# Ver estado
docker compose -f app/docker-compose.yml ps

# Ver logs de la base de datos
docker compose -f app/docker-compose.yml logs db

# Detener servicios
docker compose -f app/docker-compose.yml down

# Detener y borrar datos
docker compose -f app/docker-compose.yml down -v
```

### Sequelize

```bash
# Revertir semilla
npx sequelize-cli db:seed:undo:all

# Revertir migraciones
npx sequelize-cli db:migrate:undo:all

# Nueva migración
npx sequelize-cli migration:generate --name nombre-de-la-migracion

# Nuevo seeder
npx sequelize-cli seed:generate --name nombre-del-seeder
```

---

## Variables de entorno

### `.env` — ejecución nativa en Windows

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PORT=3000
ADMIN_EMAIL=admin@bar.example
ADMIN_PASSWORD=admin123
```

> El puerto `5433` mapea al `5432` del contenedor Docker (evita conflictos con PostgreSQL local).

### `.env.db` — ejecución en Docker

```env
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PORT=3000
ADMIN_EMAIL=admin@bar.example
ADMIN_PASSWORD=admin123
```

> Cuando la app corre en Docker, `POSTGRES_HOST` debe ser `db` (nombre del servicio en `docker-compose.yml`).

---

## Modelos

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Bebida` | `bebidas` | Menú de tragos con nombre, precio y descripción |
| `Barra` | `barras` | Puntos de venta del local (número y sector) |
| `Venta` | `ventas` | Comprobantes con número, fecha, hora y total |
| `DetalleVenta` | `detalle_ventas` | Líneas que vinculan venta, bebida y barra con cantidad y subtotal |

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 18+            |
| Docker      | 24+            |
| npm         | 9+             |

---


