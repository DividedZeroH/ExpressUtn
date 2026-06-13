# Capa Repository

Abstrae el acceso a datos detrás de un contrato único ([`BaseRepository`](base.repository.js)),
para poder **cambiar de ORM sin tocar el código que consume datos**.

Hoy hay dos implementaciones del mismo contrato:

| Driver | ORM | Base de datos | Estado |
|--------|-----|---------------|--------|
| `sequelize` | Sequelize 6 | PostgreSQL | En uso (modelos de `src/models/`) |
| `drizzle` | Drizzle ORM | PostgreSQL | Listo por conexión (schema propio, misma base) |
| `mongoose` | Mongoose 8 | MongoDB | Listo por conexión (schemas propios) |

## Cómo se elige el ORM

Por la variable de entorno `DB_DRIVER` (en `.env`):

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

## Contrato (`BaseRepository`)

| Método | Descripción |
|--------|-------------|
| `findAll({ where, order, limit, offset })` | Lista registros |
| `findById(id)` | Uno por id (o `null`) |
| `findOne(where)` | Primero que cumpla el filtro |
| `create(data)` | Crea y devuelve |
| `update(id, data)` | Actualiza y devuelve |
| `delete(id)` | Borra; `true` si borró |
| `count(where)` | Cuenta registros |

## Estructura

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
    ├── schemas.js                 # Schemas Mongoose de las 4 entidades
    ├── mongoose.repository.js     # Implementación genérica Mongoose
    └── index.js                   # Mapea las 4 entidades a sus schemas
```

## Notas

- **AdminJS no usa esta capa.** AdminJS se acopla al ORM por su *adapter*
  (`@adminjs/sequelize`) y sigue trabajando directo contra los modelos Sequelize.
  El repository sirve para código propio (servicios, rutas/API, dashboards).
- Las implementaciones Drizzle y Mongoose se importan de forma **dinámica**: si
  `DB_DRIVER` no las selecciona, sus paquetes (`drizzle-orm` / `mongoose`) ni se
  cargan.
- El driver `drizzle` apunta al **mismo PostgreSQL** que Sequelize (reusa
  `POSTGRES_*`), así que funciona contra las tablas ya migradas. La opción
  `order` de `findAll` no está implementada en la versión Drizzle (las otras sí).
- Para correr con MongoDB hace falta un servidor Mongo escuchando en `MONGO_URI`
  (local o contenedor) — no se incluye en el `docker-compose.yml` porque no se
  migró la base; queda a criterio de quien active el driver.
