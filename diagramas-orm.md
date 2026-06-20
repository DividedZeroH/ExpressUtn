# Diagramas — Modelos y Migraciones en Sequelize

## 1. Relación entre Modelo y Migración

```mermaid
flowchart LR
    subgraph JS["📄 Modelo (src/models/*.js)"]
        A["sequelize.define('Bebida', { ... })"]
    end

    subgraph MIG["📄 Migración (src/migrations/*.js)"]
        B["queryInterface.createTable / addColumn / removeColumn"]
    end

    subgraph DB["🗄️ PostgreSQL"]
        C["Tabla real con columnas"]
    end

    A -- "le dice a Sequelize CÓMO LEER los datos en JS" --> JS
    B -- "db:migrate ejecuta esto" --> C
    JS -. "deben coincidir entre sí" .-> MIG

    style JS fill:#ede9fe,stroke:#7c3aed
    style MIG fill:#dbeafe,stroke:#2563eb
    style DB fill:#dcfce7,stroke:#16a34a
```

> **Regla de oro:** el modelo es el *mapa*, la migración es el *constructor*. Cambiar uno sin el otro deja todo desincronizado.

---

## 2. Crear una tabla nueva (modelo + migración)

```mermaid
flowchart TD
    Start(["Necesito una tabla nueva"]) --> M1["1. Crear src/models/entidad.js<br/>export default (sequelize, DataTypes) => ..."]
    M1 --> M2["2. sequelize.define('Entidad', { columnas })"]
    M2 --> G["3. npx sequelize-cli migration:generate --name crear-entidad"]
    G --> F["4. Completar el archivo generado:<br/>up() → createTable<br/>down() → dropTable"]
    F --> Run["5. npx sequelize-cli db:migrate"]
    Run --> End(["✅ Tabla creada en PostgreSQL"])

    style Start fill:#fef3c7,stroke:#d97706
    style End fill:#dcfce7,stroke:#16a34a
```

### Código de referencia

```js
// up()
await queryInterface.createTable('bebidas', {
  id:     { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: Sequelize.STRING(200), allowNull: false, unique: true },
  precio: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
});

// down()
await queryInterface.dropTable('bebidas');
```

---

## 3. Agregar una columna a una tabla existente

```mermaid
flowchart TD
    Start(["La tabla ya existe,<br/>necesito una columna nueva"]) --> M1["1. Agregar la propiedad en el modelo<br/>(src/models/entidad.js)"]
    M1 --> G["2. npx sequelize-cli migration:generate<br/>--name agregar-columna"]
    G --> F["3. Completar:<br/>up() → addColumn<br/>down() → removeColumn"]
    F --> Run["4. npx sequelize-cli db:migrate"]
    Run --> Check{"¿Tenía datos<br/>antes la tabla?"}
    Check -- "Sí" --> Default["Cada fila existente recibe<br/>el defaultValue automáticamente"]
    Check -- "No" --> Empty["La columna se crea vacía,<br/>lista para nuevos registros"]
    Default --> End(["✅ Columna agregada"])
    Empty --> End

    style Start fill:#fef3c7,stroke:#d97706
    style End fill:#dcfce7,stroke:#16a34a
    style Default fill:#ede9fe,stroke:#7c3aed
```

### Código de referencia

```js
// up()
await queryInterface.addColumn('bebidas', 'stock', {
  type: Sequelize.INTEGER,
  allowNull: false,
  defaultValue: 0,   // ← esto es lo que reciben las filas viejas
});

// down()
await queryInterface.removeColumn('bebidas', 'stock');
```

---

## 4. Eliminar una columna

```mermaid
flowchart TD
    Start(["Necesito sacar<br/>una columna"]) --> M1["1. Borrar/comentar la propiedad<br/>en el modelo JS"]
    M1 --> G["2. npx sequelize-cli migration:generate<br/>--name eliminar-columna"]
    G --> F["3. Completar:<br/>up() → removeColumn<br/>down() → addColumn (para poder revertir)"]
    F --> Run["4. npx sequelize-cli db:migrate"]
    Run --> Warn["⚠️ Los datos de esa columna<br/>se pierden para siempre"]
    Warn --> End(["✅ Columna eliminada"])

    style Start fill:#fef3c7,stroke:#d97706
    style Warn fill:#fee2e2,stroke:#dc2626
    style End fill:#dcfce7,stroke:#16a34a
```

### Código de referencia

```js
// up()
await queryInterface.removeColumn('bebidas', 'stock');

// down()  → para poder deshacer el cambio si hace falta
await queryInterface.addColumn('bebidas', 'stock', {
  type: Sequelize.INTEGER,
  allowNull: false,
  defaultValue: 0,
});
```

---

## 5. Otras operaciones comunes de `queryInterface`

```mermaid
flowchart LR
    QI["queryInterface"] --> A["createTable(nombre, columnas)"]
    QI --> B["dropTable(nombre)"]
    QI --> C["addColumn(tabla, col, def)"]
    QI --> D["removeColumn(tabla, col)"]
    QI --> E["changeColumn(tabla, col, def)"]
    QI --> F["renameColumn(tabla, viejo, nuevo)"]
    QI --> G["addIndex(tabla, [cols])"]
    QI --> H["removeIndex(tabla, [cols])"]
    QI --> I["bulkInsert(tabla, filas)  ← seeders"]
    QI --> J["bulkDelete(tabla, where)  ← seeders"]

    style QI fill:#1e1b4b,stroke:#7c3aed,color:#fff
```

| Método | Para qué sirve |
|---|---|
| `createTable` | Crear una tabla nueva con sus columnas |
| `dropTable` | Eliminar una tabla completa |
| `addColumn` | Agregar una columna a una tabla existente |
| `removeColumn` | Eliminar una columna |
| `changeColumn` | Cambiar el tipo o restricciones de una columna |
| `renameColumn` | Cambiarle el nombre a una columna |
| `addIndex` / `removeIndex` | Agregar/quitar índices |
| `bulkInsert` / `bulkDelete` | Insertar/borrar datos masivos (usado en **seeders**, no en migraciones) |

---

## 6. El flujo completo de comandos (de punta a punta)

```mermaid
sequenceDiagram
    participant Dev as Desarrollador
    participant CLI as sequelize-cli
    participant FS as Archivos (src/)
    participant DB as PostgreSQL

    Dev->>FS: Edita el modelo (src/models/entidad.js)
    Dev->>CLI: migration:generate --name X
    CLI->>FS: Crea archivo vacío en src/migrations/
    Dev->>FS: Completa up() y down()
    Dev->>CLI: db:migrate
    CLI->>DB: Ejecuta up() de cada migración pendiente
    DB-->>CLI: Tabla/columna creada
    CLI->>DB: Registra el nombre en SequelizeMeta
    Dev->>CLI: db:seed:all
    CLI->>DB: Ejecuta bulkInsert de los seeders
    DB-->>Dev: Datos de prueba cargados ✅
```

---

## 7. Migración vs Modelo — quién hace qué

```mermaid
flowchart TB
    subgraph Pregunta["¿Qué estoy cambiando?"]
        direction TB
        Q1["¿Cambia la ESTRUCTURA<br/>de la base de datos?"]
        Q2["¿Cambia cómo JS<br/>LEE esos datos?"]
    end

    Q1 -- Sí --> Mig["Crear/editar una MIGRACIÓN<br/>(createTable, addColumn, etc.)"]
    Q2 -- Sí --> Mod["Editar el MODELO<br/>(sequelize.define)"]

    Mig --> Both["En la práctica,<br/>casi siempre se editan LOS DOS JUNTOS"]
    Mod --> Both

    style Mig fill:#dbeafe,stroke:#2563eb
    style Mod fill:#ede9fe,stroke:#7c3aed
    style Both fill:#fef3c7,stroke:#d97706
```
