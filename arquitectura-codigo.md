# Arquitectura del código fuente — Bar Express

## 1. Estructura general de carpetas

```mermaid
flowchart TD
    Root["app/src/"] --> Admin["admin/<br/>panel AdminJS"]
    Root --> Models["models/<br/>mapa de tablas (Sequelize)"]
    Root --> Migrations["migrations/<br/>historial de cambios en la BD"]
    Root --> Seeders["seeders/<br/>datos de prueba"]
    Root --> Repos["repositories/<br/>abstracción de ORM"]
    Root --> Modules["modules/<br/>API REST por feature"]
    Root --> Shared["shared/<br/>utilidades comunes"]
    Root --> AppJS["app.js<br/>punto de entrada"]

    style Root fill:#1e1b4b,stroke:#7c3aed,color:#fff
    style AppJS fill:#fef3c7,stroke:#d97706
```

| Carpeta | Responsabilidad |
|---|---|
| `models/` | Define las tablas y sus columnas para Sequelize |
| `migrations/` | Historial versionado de cambios de esquema |
| `seeders/` | Datos de ejemplo para popular la base |
| `repositories/` | Capa que abstrae el ORM (Sequelize / Drizzle / Mongoose) |
| `modules/` | API REST organizada por entidad (routes → controller → service) |
| `admin/` | Configuración del panel AdminJS |
| `shared/` | Funciones reutilizables (manejo de errores, async) |
| `app.js` | Arranca Express, conecta todo |

---

## 2. Arranque de la aplicación (`app.js`)

```mermaid
sequenceDiagram
    participant Node as node src/app.js
    participant Models as models/index.js
    participant Admin as admin/index.js
    participant API as modules/index.js
    participant Express as Express App
    participant DB as PostgreSQL

    Node->>Models: import { sequelize }
    Models->>DB: new Sequelize(config)
    Node->>Admin: import adminConfig
    Node->>API: import apiRouter
    Node->>Express: new AdminJS(adminConfig)
    Express->>DB: sessionStore.sync()
    Node->>Express: app.use('/admin', adminRouter)
    Node->>Express: app.use('/api', express.json(), apiRouter)
    Node->>Express: app.use(errorHandler)
    Node->>DB: sequelize.authenticate()
    DB-->>Node: conexión OK
    Node->>Express: app.listen(PORT)
    Express-->>Node: "Servidor corriendo en :3000"
```

### Puntos clave de `app.js`

- **`/admin`** → todo el tráfico del panel AdminJS (usa `express-formidable` internamente)
- **`/api`** → la API REST propia, con `express.json()` aplicado **solo ahí** (para no romper AdminJS)
- **`errorHandler`** → middleware de 4 argumentos, siempre al final, captura errores de todas las rutas

---

## 3. Flujo de una request a la API REST

```mermaid
flowchart LR
    Client["Cliente<br/>(fetch / curl / Postman)"] -->|"GET /api/bebidas"| Router["modules/index.js<br/>(router central)"]
    Router --> Routes["bebidas.routes.js<br/>mapea verbo+path"]
    Routes --> Controller["bebidas.controller.js<br/>parsea req/res"]
    Controller --> Service["bebidas.service.js<br/>lógica + validación"]
    Service --> Repo["repositories/<br/>getRepositories()"]
    Repo --> ORM["Sequelize / Drizzle / Mongoose<br/>(según DB_DRIVER)"]
    ORM --> DB[("PostgreSQL")]
    DB -.->|"datos"| ORM
    ORM -.-> Repo
    Repo -.-> Service
    Service -.-> Controller
    Controller -.->|"JSON"| Client

    style Client fill:#fef3c7,stroke:#d97706
    style DB fill:#dcfce7,stroke:#16a34a
    style Repo fill:#ede9fe,stroke:#7c3aed
```

### Las 4 capas de cada módulo

```mermaid
flowchart TD
    R["routes.js<br/>'¿qué URL y qué verbo HTTP?'"] --> C["controller.js<br/>'¿qué status code devuelvo?'"]
    C --> S["service.js<br/>'¿la lógica de negocio es válida?'"]
    S --> Rep["repository<br/>'¿cómo hablo con la base?'"]

    style R fill:#dbeafe,stroke:#2563eb
    style C fill:#fef3c7,stroke:#d97706
    style S fill:#ede9fe,stroke:#7c3aed
    style Rep fill:#dcfce7,stroke:#16a34a
```

| Capa | Archivo ejemplo | Responsabilidad |
|---|---|---|
| Routes | `bebidas.routes.js` | Asocia `GET /` → `getAll`, `POST /` → `create`, etc. |
| Controller | `bebidas.controller.js` | Lee `req.params`/`req.body`, llama al service, devuelve `res.json()` con el status correcto |
| Service | `bebidas.service.js` | Valida datos, aplica reglas de negocio, llama al repository |
| Repository | `repositories/sequelize/...` | Traduce a consultas concretas del ORM activo |

---

## 4. Capa Repository — abstracción de ORM

```mermaid
flowchart TD
    Service["Cualquier service<br/>(bebidas, ventas, etc.)"] --> Factory["repositories/index.js<br/>getRepositories()"]

    Factory --> Env{"DB_DRIVER en .env"}
    Env -- "sequelize (default)" --> Seq["sequelize/<br/>SequelizeRepository"]
    Env -- "drizzle" --> Driz["drizzle/<br/>DrizzleRepository"]
    Env -- "mongoose" --> Mong["mongoose/<br/>MongooseRepository"]

    Seq --> PG1[("PostgreSQL<br/>vía Sequelize")]
    Driz --> PG2[("PostgreSQL<br/>vía Drizzle")]
    Mong --> Mongo[("MongoDB")]

    style Factory fill:#1e1b4b,stroke:#7c3aed,color:#fff
    style Env fill:#fef3c7,stroke:#d97706
```

Cada implementación cumple el mismo contrato (`BaseRepository`):

```mermaid
classDiagram
    class BaseRepository {
        +findAll(where, order, limit, offset)
        +findById(id)
        +findOne(where)
        +create(data)
        +update(id, data)
        +delete(id)
        +count(where)
    }
    BaseRepository <|-- SequelizeRepository
    BaseRepository <|-- DrizzleRepository
    BaseRepository <|-- MongooseRepository
```

> El service nunca sabe qué ORM hay debajo — solo llama `repos.bebidas.findAll()`. Cambiar de motor de base de datos es cambiar una variable de entorno, no el código.

---

## 5. Modelos y relaciones (Foreign Keys)

```mermaid
erDiagram
    BARRA ||--o{ DETALLE_VENTA : despacha
    BEBIDA ||--o{ DETALLE_VENTA : vendida_en
    VENTA ||--o{ DETALLE_VENTA : contiene

    BARRA {
        int id PK
        int numero_barra
        string sector
    }
    BEBIDA {
        int id PK
        string nombre
        decimal precio
        text descripcion
        int stock
    }
    VENTA {
        int id PK
        int numero_venta
        date fecha
        time hora
        decimal total
    }
    DETALLE_VENTA {
        int id PK
        int venta_id FK
        int bebida_id FK
        int barra_id FK
        int cantidad
        decimal subtotal
    }
```

### Cómo se declaran esas asociaciones (`models/index.js`)

```js
Venta.hasMany(DetalleVenta,  { foreignKey: 'venta_id' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

Bebida.hasMany(DetalleVenta,  { foreignKey: 'bebida_id' });
DetalleVenta.belongsTo(Bebida, { foreignKey: 'bebida_id' });

Barra.hasMany(DetalleVenta,  { foreignKey: 'barra_id' });
DetalleVenta.belongsTo(Barra, { foreignKey: 'barra_id' });
```

---

## 6. Panel AdminJS — flujo paralelo a la API

```mermaid
flowchart LR
    Browser["Navegador"] -->|"/admin"| AdminRouter["AdminJSExpress<br/>buildAuthenticatedRouter"]
    AdminRouter --> Auth{"¿Login válido?<br/>ADMIN_EMAIL / ADMIN_PASSWORD"}
    Auth -- No --> Login["Página de login"]
    Auth -- Sí --> AdminJS["adminConfig<br/>(admin/index.js)"]
    AdminJS --> SeqAdapter["@adminjs/sequelize<br/>adapter"]
    SeqAdapter --> Models["Modelos Sequelize<br/>(Barra, Bebida, Venta, DetalleVenta)"]
    Models --> DB[("PostgreSQL")]

    style AdminJS fill:#ede9fe,stroke:#7c3aed
    style DB fill:#dcfce7,stroke:#16a34a
```

> **Importante:** AdminJS **no usa** la capa `repositories/`. Habla directo con los modelos Sequelize a través de su propio adapter (`@adminjs/sequelize`). Por eso, sea cual sea el `DB_DRIVER` elegido para la API, AdminJS siempre funciona sobre PostgreSQL vía Sequelize.

---

## 7. Migraciones y Seeders — ciclo de vida de la base

```mermaid
flowchart LR
    A["docker compose up<br/>PostgreSQL vacío"] --> B["db:migrate<br/>crea las tablas"]
    B --> C["db:seed:all<br/>carga datos de prueba"]
    C --> D["npm run dev-start<br/>arranca Express"]
    D --> E["App funcionando<br/>con datos"]

    style A fill:#fee2e2,stroke:#dc2626
    style E fill:#dcfce7,stroke:#16a34a
```

```mermaid
flowchart TD
    Mig["migrations/*.js"] -->|"up()"| Estructura["Estructura de tablas<br/>(createTable, addColumn...)"]
    Seed["seeders/*.js"] -->|"bulkInsert"| Datos["Filas con datos<br/>de ejemplo"]
    Estructura -.->|"debe existir antes"| Datos

    style Estructura fill:#dbeafe,stroke:#2563eb
    style Datos fill:#ede9fe,stroke:#7c3aed
```

---

## 8. Manejo de errores (`shared/`)

```mermaid
flowchart TD
    Controller["Controller<br/>(ej: bebidas.controller.js)"] --> Async["asyncHandler(fn)<br/>envuelve la función async"]
    Async --> Try{"¿La promesa<br/>fue rechazada?"}
    Try -- No --> OK["res.json(data)"]
    Try -- Sí --> Next["next(error)"]
    Next --> ErrorMW["errorHandler<br/>(middleware de 4 args)"]
    ErrorMW --> Code{"¿Qué tipo de error?"}
    Code -- "FK violation (23503)" --> E409["409 Conflict"]
    Code -- "Duplicado (23505)" --> E409
    Code -- "err.status definido" --> ECustom["ese status"]
    Code -- "Otro" --> E500["500 Internal Server Error"]

    style Async fill:#fef3c7,stroke:#d97706
    style ErrorMW fill:#fee2e2,stroke:#dc2626
```

### Por qué existe `asyncHandler`

Express no captura automáticamente errores de funciones `async`. Sin este wrapper, una promesa rechazada dentro de un controller colgaría la request en vez de llegar al `errorHandler`.

```js
// shared/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

---

## 9. Vista completa — toda la arquitectura junta

```mermaid
flowchart TB
    Client["Cliente HTTP"] --> AppJS["app.js"]

    AppJS --> AdminPath["/admin"]
    AppJS --> ApiPath["/api"]

    AdminPath --> AdminCfg["admin/index.js"] --> SeqAdapter["@adminjs/sequelize"]
    ApiPath --> ApiRouter["modules/index.js"] --> Mod["routes → controller → service"]
    Mod --> RepoFactory["repositories/index.js"]

    SeqAdapter --> ModelsIdx["models/index.js"]
    RepoFactory --> ModelsIdx

    ModelsIdx --> PG[("PostgreSQL")]

    Mig["migrations/"] -.->|"define estructura"| PG
    Seed["seeders/"] -.->|"carga datos"| PG

    style AppJS fill:#1e1b4b,stroke:#7c3aed,color:#fff
    style PG fill:#dcfce7,stroke:#16a34a
    style Mig fill:#fef3c7,stroke:#d97706
    style Seed fill:#fef3c7,stroke:#d97706
```
