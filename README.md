# Bar Express — Sistema de gestión de bar (SQL + NoSQL)

API REST + panel de administración para gestionar **bebidas, barras, ventas y
detalles de venta**. Construido con **Express**, con una **capa de repositorios
intercambiable** que permite correr el mismo código sobre **PostgreSQL (Sequelize)**
o **MongoDB (Mongoose)** cambiando una sola variable de entorno.

> Este repositorio (`ExpressUtn-Mongo`) contiene la versión con soporte NoSQL
> agregado sobre el proyecto original SQL.

## Stack

| Capa | Tecnología |
|------|-----------|
| Servidor | Express 4 |
| ORM SQL | Sequelize 6 + PostgreSQL |
| ODM NoSQL | Mongoose 8 + MongoDB |
| ORM SQL alternativo | Drizzle (mismo Postgres) |
| Panel admin | AdminJS 7 (`@adminjs/sequelize`) |
| Infra | Docker Compose (PostgreSQL + MongoDB) |

---

## Índice

1. [Arranque rápido](#1-arranque-rápido)
2. [Informe: usar una base NoSQL con nuestra ORM](#2-informe-usar-una-base-nosql-con-nuestra-orm) ← **entregable de la consigna**
3. [Capa Repository (detalle técnico)](#3-capa-repository-detalle-técnico)
4. [Comandos de referencia](#4-comandos-de-referencia)
5. [Guía Sequelize: tablas, columnas y migraciones](#5-guía-sequelize-tablas-columnas-y-migraciones)

---

## 1. Arranque rápido

Todo se ejecuta desde la carpeta `app/`:

```bash
cd app
npm install
```

### Modo SQL / Sequelize (por defecto)

```bash
docker compose up -d --wait db
# Las migraciones locales apuntan a localhost:5433 (el compose mapea 5433:5432).
POSTGRES_HOST=localhost POSTGRES_PORT=5433 npx sequelize-cli db:migrate
POSTGRES_HOST=localhost POSTGRES_PORT=5433 npx sequelize-cli db:seed:all
npm start                      # API + panel /admin
```

### Modo NoSQL / Mongoose

```bash
docker compose up -d --wait mongo
npm run seed:mongo             # carga los mismos datos que la base SQL
npm run start:mongo            # API REST (sin panel /admin)
```

### URLs

| URL | Qué es |
|-----|--------|
| `http://localhost:3000/api/bebidas` | API REST en JSON (ambos modos) |
| `http://localhost:3000/admin` | Panel AdminJS — **solo modo SQL** (login: `admin@barexpress.utn` / `admin_utn_pass_123`) |

> ⚠️ **Conexión local:** sin un archivo `.env`, `database.cjs` usa `localhost:5432`
> por defecto, pero Docker mapea Postgres en **`5433`**. Por eso los comandos
> `npx sequelize-cli` locales llevan `POSTGRES_HOST=localhost POSTGRES_PORT=5433`
> por delante (o creá un `.env` con esos valores).

---

## 2. Informe: usar una base NoSQL con nuestra ORM

**Consigna:** tomar una base de datos que **no sea SQL** y anotar todo lo que se
necesita modificar para que funcione con el ORM que utilizamos.

**Base NoSQL elegida:** MongoDB (vía Mongoose).
**Proyecto:** Bar Express (Express + Sequelize + AdminJS).

### 2.0. Respuesta directa a la consigna (lo más importante)

> ⚠️ **El ORM que usamos (Sequelize) NO soporta bases NoSQL.**
> Sequelize solo trabaja con bases **SQL** (PostgreSQL, MySQL, MariaDB, SQLite,
> MSSQL, Db2). **No tiene driver para MongoDB** ni para ninguna NoSQL. Por lo
> tanto, *literalmente no se puede "hacer que MongoDB funcione con Sequelize"*.

Entonces, para incorporar una base NoSQL hay que:

1. **Reemplazar el ORM por un ODM** apropiado para NoSQL → **Mongoose** (el
   equivalente a Sequelize pero para MongoDB).
2. **Aislar el acceso a datos** detrás de una interfaz común (patrón **Repository**)
   para que el resto de la app no dependa de Sequelize ni de Mongoose.
3. **Resolver las incompatibilidades** entre el modelo relacional y el documental
   (ids, FKs, migraciones, relaciones) — ver sección 2.4.
4. **Desacoplar el arranque y AdminJS**, que están atados a Sequelize (sección 2.4.2).

> **TL;DR del impacto:** gracias a la capa Repository, **la lógica de negocio NO se
> toca**. Toda la API REST (servicios, controllers, rutas) sigue igual. El cambio se
> concentra en la capa de datos y el arranque. En números: **9 archivos**,
> **~192 líneas agregadas / ~52 modificadas**, **0 cambios en los servicios**.

### 2.1. Por qué cambia tan poco (una vez que existe la capa Repository)

El proyecto usa el patrón **Repository**: todo el código que consume datos pide
los repositorios con `getRepositories()` y trabaja contra un contrato común
(`BaseRepository`), sin saber qué ORM hay debajo.

```
Controllers ──> Services ──> getRepositories() ──> [ Sequelize | Drizzle | Mongoose ]
                                  (fábrica)              implementaciones intercambiables
```

Cambiar de ORM = **elegir otra implementación del mismo contrato** + ajustar el
arranque. El resto del código ni se entera.

### 2.2. Qué se tocó exactamente

| Archivo | Tipo | Qué cambió |
|---------|------|-----------|
| `src/repositories/mongoose/schemas.js` | ✏️ Modificado | Se agregó `id` numérico a las 4 entidades, `stock` a bebida y limpieza del JSON (`_id` oculto) |
| `src/repositories/mongoose/mongoose.repository.js` | ✏️ Modificado | `findById/update/delete` operan por `id` numérico; `create` autoincrementa el id |
| `src/repositories/mongoose/counter.js` | 🆕 Nuevo | Autoincremento de ids (equivalente al `SERIAL` de Postgres) |
| `src/seeders/mongo-seed.mjs` | 🆕 Nuevo | Seeder de Mongo con los mismos datos que la base SQL |
| `src/app.js` | ✏️ Modificado | Arranca AdminJS+Sequelize solo si el driver es SQL; con Mongo monta solo la API |
| `docker-compose.yml` | ✏️ Modificado | Se agregó el servicio `mongo` + volumen |
| `.env.db` | ✏️ Modificado | Variables `DB_DRIVER` y `MONGO_URI` |
| `package.json` | ✏️ Modificado | Scripts `seed:mongo` / `start:mongo` + dep `cross-env` |

**Total:** 7 modificados + 2 nuevos ≈ **192 líneas agregadas, 52 modificadas**.

### 2.3. Qué NO se tocó (lo importante)

| Capa | Archivos | ¿Cambia? |
|------|----------|----------|
| **Servicios** (lógica de negocio) | `*/...service.js` (4) | ❌ **0 cambios** |
| **Controllers** | `*/...controller.js` (4) | ❌ **0 cambios** |
| **Rutas** | `*/...routes.js` (4) | ❌ **0 cambios** |
| **Contrato** | `base.repository.js` | ❌ **0 cambios** |
| **Driver Sequelize** | `sequelize/*`, `models/*` | ❌ **0 cambios** |

> El camino SQL sigue funcionando **idéntico**: `DB_DRIVER=sequelize` (default)
> levanta Postgres + AdminJS + API tal cual antes.

### 2.4. Decisiones de diseño (los "puntos difíciles")

Migrar a NoSQL no es gratis: hubo 3 incompatibilidades reales que se resolvieron
sin tocar la lógica de negocio.

#### 2.4.1. Ids: `ObjectId` vs entero
- **Problema:** Mongo usa `_id` (ObjectId de 24 hex). La API y las FK del proyecto
  usan **enteros** (`/api/bebidas/1`, `venta_id: 4`). Los servicios validan los ids
  con `parseEntero()` → un ObjectId los rompería.
- **Solución:** cada documento lleva un campo numérico **`id`** autoincremental
  (colección `counters`). El `_id` interno se oculta en el JSON. Así la API queda
  **idéntica** a la de SQL.

#### 2.4.2. Arranque acoplado a Sequelize
- **Problema:** `app.js` cargaba Sequelize, `sequelize.authenticate()`, el store de
  sesión y **AdminJS** sin importar el driver.
- **Solución:** se ramifica por `DB_DRIVER`. Con Mongo se saltean Sequelize y
  AdminJS y se monta solo la API.
- **Costo:** ⚠️ **el panel `/admin` (AdminJS) no funciona con Mongo** — AdminJS se
  acopla al adapter de Sequelize. Es la única funcionalidad que se pierde.

#### 2.4.3. Sin migraciones ni seeders de sequelize-cli
- **Problema:** NoSQL no usa migraciones. Los seeders `001`/`002` son de
  `sequelize-cli` → Postgres.
- **Solución:** un seeder propio (`mongo-seed.mjs`) carga los mismos datos. El campo
  `stock` (que en SQL necesitó una migración) en Mongo simplemente existe en el schema.

### 2.5. Veredicto

| Aspecto | Esfuerzo |
|---------|----------|
| Lógica de negocio (servicios/controllers/rutas) | 🟢 Nulo |
| Capa de datos (nuevo driver) | 🟡 Medio (ya estaba el andamiaje) |
| Arranque / infraestructura | 🟡 Medio (compose + app.js) |
| Funcionalidad perdida | 🔴 Panel `/admin` (AdminJS) solo en SQL |

**Conclusión:** el patrón Repository hizo que cambiar de SQL a NoSQL sea
**localizado y de bajo riesgo**. Se puede alternar entre Postgres y MongoDB con una
sola variable de entorno (`DB_DRIVER`), sin reescribir la aplicación. El único
recorte real es el panel de administración, que depende del ORM por diseño.

---

## 3. Capa Repository (detalle técnico)

Abstrae el acceso a datos detrás de un contrato único (`base.repository.js`),
para poder **cambiar de ORM sin tocar el código que consume datos**.

Hay tres implementaciones del mismo contrato:

| Driver | ORM | Base de datos | Estado |
|--------|-----|---------------|--------|
| `sequelize` | Sequelize 6 | PostgreSQL | En uso (modelos de `src/models/`) |
| `drizzle` | Drizzle ORM | PostgreSQL | Listo por conexión (schema propio, misma base) |
| `mongoose` | Mongoose 8 | MongoDB | **Operativo** (API REST end-to-end; ids enteros y seeder propio) |

### Cómo se elige el ORM

Por la variable de entorno `DB_DRIVER`:

```env
DB_DRIVER=sequelize          # PostgreSQL vía Sequelize (por defecto)
# DB_DRIVER=drizzle          # PostgreSQL vía Drizzle (misma base, reusa POSTGRES_*)
# DB_DRIVER=mongoose         # MongoDB
MONGO_URI=mongodb://localhost:27017/bar
```

El consumidor nunca sabe qué ORM hay debajo:

```js
import { getRepositories } from './repositories/index.js';

const repos = await getRepositories();

await repos.bebidas.findAll();
await repos.bebidas.create({ nombre: 'Aperol Spritz', precio: 1800 });
await repos.barras.findById(2);
await repos.ventas.count();
await repos.detalleVentas.delete(5);
```

### Contrato (`BaseRepository`)

| Método | Descripción |
|--------|-------------|
| `findAll({ where, order, limit, offset })` | Lista registros |
| `findById(id)` | Uno por id (o `null`) |
| `findOne(where)` | Primero que cumpla el filtro |
| `create(data)` | Crea y devuelve |
| `update(id, data)` | Actualiza y devuelve |
| `delete(id)` | Borra; `true` si borró |
| `count(where)` | Cuenta registros |

### Estructura

```
repositories/
├── index.js                       # Fábrica: elige driver por DB_DRIVER
├── base.repository.js             # Contrato común
├── sequelize/
│   ├── sequelize.repository.js    # Implementación genérica Sequelize
│   └── index.js                   # Mapea las 4 entidades a sus modelos
├── drizzle/
│   ├── connection.js              # Pool pg + drizzle (perezoso)
│   ├── schema.js                  # Tablas Drizzle de las 4 entidades
│   ├── drizzle.repository.js      # Implementación genérica Drizzle
│   └── index.js                   # Mapea las 4 entidades a sus tablas
└── mongoose/
    ├── connection.js              # mongoose.connect (singleton perezoso)
    ├── counter.js                 # Autoincremento de ids (colección counters)
    ├── schemas.js                 # Schemas Mongoose de las 4 entidades
    ├── mongoose.repository.js     # Implementación genérica Mongoose
    └── index.js                   # Mapea las 4 entidades a sus schemas
```

### Notas de diseño del driver Mongoose
- Cada documento tiene un campo numérico **`id`** autoincremental (colección
  `counters`, ver `mongoose/counter.js`; el seeder vive en `seeders/mongo-seed.mjs`)
  en vez de usar el `ObjectId` `_id`. Así las rutas `/api/recurso/1` y las FK enteras
  (`venta_id`, `bebida_id`, `barra_id`) siguen funcionando sin cambiar los servicios.
- El `_id` interno de Mongo se oculta en la salida JSON (transform `toJSON`).
- Como NoSQL no usa migraciones, el campo `stock` ya existe en el schema y se
  carga directamente desde el seeder.

### Otras notas
- **AdminJS no usa esta capa.** AdminJS se acopla al ORM por su *adapter*
  (`@adminjs/sequelize`) y trabaja directo contra los modelos Sequelize. El
  repository sirve para código propio (servicios, rutas/API).
- Las implementaciones Drizzle y Mongoose se importan de forma **dinámica**: si
  `DB_DRIVER` no las selecciona, sus paquetes (`drizzle-orm` / `mongoose`) ni se cargan.
- El driver `drizzle` apunta al **mismo PostgreSQL** que Sequelize (reusa
  `POSTGRES_*`). La opción `order` de `findAll` no está implementada en Drizzle.
- Para MongoDB hace falta el servidor Mongo escuchando en `MONGO_URI` — ya incluido
  como servicio `mongo` en `docker-compose.yml`.

---

## 4. Comandos de referencia

Todo desde `app/`.

### Base de datos (Docker)

```bash
docker compose up -d --wait db        # PostgreSQL (modo SQL)
docker compose up -d --wait mongo     # MongoDB (modo NoSQL)
docker compose stop db mongo          # parar
```

### Migraciones y seeders (SQL / Sequelize)

```bash
# Recordá anteponer POSTGRES_HOST=localhost POSTGRES_PORT=5433 al correr en local.
npx sequelize-cli db:migrate:status         # estado de migraciones
npx sequelize-cli db:migrate                # aplicar pendientes
npx sequelize-cli db:migrate --to <archivo> # aplicar hasta una migración puntual
npx sequelize-cli db:migrate:undo           # deshacer la última
npx sequelize-cli db:migrate:undo:all       # deshacer todas
npx sequelize-cli db:seed:all               # cargar todos los seeders
npx sequelize-cli db:seed:undo              # deshacer el último seeder
npx sequelize-cli migration:generate --name <nombre>
npx sequelize-cli seed:generate --name <nombre>
```

### Seeder y arranque (NoSQL / Mongoose)

```bash
npm run seed:mongo     # node src/seeders/mongo-seed.mjs
npm run start:mongo    # cross-env DB_DRIVER=mongoose node src/app.js
```

### Verificación en PostgreSQL

```bash
docker exec -it app-db-1 psql -U bar_user -d bar_db
# dentro de psql:  \dt   \d bebidas   SELECT * FROM bebidas;   \q
```

### Verificación en MongoDB

```bash
docker exec -it app-mongo-1 mongosh bar
# dentro de mongosh:  show collections   db.bebidas.find()   db.counters.find()
```

---

## 5. Guía Sequelize: tablas, columnas y migraciones

Referencia para extender el modelo **SQL** del proyecto.

### Estructura de modelos

```
app/src/
├── models/
│   ├── index.js              ← Conecta BD, carga modelos, define relaciones
│   ├── barra.js / bebida.js / venta.js / detalleventa.js
├── migrations/               ← Scripts que aplican cambios físicos en la BD
└── config/database.cjs       ← Configuración de conexión a PostgreSQL
```

**Flujo:** Modelos definen la estructura · Migraciones aplican cambios físicos ·
`index.js` conecta todo y exporta.

### Crear una nueva tabla

**1. Modelo** (`app/src/models/producto.js`):

```javascript
'use strict';

export default (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    nombre:      { type: DataTypes.STRING(150), allowNull: false, unique: true },
    precio:      { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    cantidad:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'productos',
    timestamps: false,
  });
  return Producto;
};
```

**2. Migración** (`npx sequelize-cli migration:generate --name crear-tabla-productos`):

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos', {
      id:          { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre:      { type: Sequelize.STRING(150), allowNull: false, unique: true },
      precio:      { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      cantidad:    { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      activo:      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('productos');
  },
};
```

**3. Registrar en `index.js`:**

```javascript
import ProductoModel from './producto.js';
const Producto = ProductoModel(sequelize, DataTypes);
export { sequelize, Sequelize, Barra, Bebida, Venta, DetalleVenta, Producto };
```

**4. Ejecutar:** `npx sequelize-cli db:migrate`

### Agregar una columna (ej: `stock` en `bebidas`)

```javascript
// Migración
async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('bebidas', 'stock', {
    type: Sequelize.INTEGER, allowNull: false, defaultValue: 0,
  });
},
async down(queryInterface) {
  await queryInterface.removeColumn('bebidas', 'stock');
},
```

Luego descomentar el campo en el modelo (`app/src/models/bebida.js`) y correr
`db:migrate`. Para agregar una FK usar `references: { model: 'tabla', key: 'id' }`
+ `onDelete: 'RESTRICT'`.

### Eliminar una columna

```javascript
async up(queryInterface)  { await queryInterface.removeColumn('bebidas', 'descripcion'); },
async down(queryInterface, Sequelize) {
  await queryInterface.addColumn('bebidas', 'descripcion', { type: Sequelize.TEXT, allowNull: true });
},
```

### Relaciones en `index.js`

```javascript
// Una venta tiene muchos detalles; cada detalle pertenece a una venta
Venta.hasMany(DetalleVenta,   { foreignKey: 'venta_id', as: 'Detalle' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'Venta' });
```

Habilita `DetalleVenta.findAll({ include: ['Venta'] })` (JOIN automático).

### Tipos de datos

| Sequelize | PostgreSQL | Uso |
|-----------|-----------|-----|
| `STRING(n)` | `VARCHAR(n)` | Texto corto |
| `TEXT` | `TEXT` | Texto largo |
| `INTEGER` | `INTEGER` | Enteros |
| `DECIMAL(p,s)` | `NUMERIC(p,s)` | Dinero (¡nunca FLOAT!) |
| `BOOLEAN` | `BOOLEAN` | Verdadero/Falso |
| `DATEONLY` | `DATE` | Solo fecha |
| `TIME` | `TIME` | Solo hora |
| `DATE` | `TIMESTAMP` | Fecha + hora |
| `JSON` | `JSONB` | Objeto JSON |

### Notas importantes

- ⚠️ Nunca modificar la BD a mano: siempre vía migraciones.
- ⚠️ Al agregar/quitar columnas, sincronizar el modelo (comentar/descomentar campos).
- ⚠️ En `down()`, eliminar en orden inverso (tablas con FK primero).
- ⚠️ Usar `defaultValue` en migraciones para las filas que ya existen.
- ✅ Convención: `minusculas_con_guiones` en BD, `camelCase` en modelos.
