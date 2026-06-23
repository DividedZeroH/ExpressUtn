# Guía Completa: Crear Tablas, Agregar/Eliminar Columnas y Usar index.js

## 📋 Índice
1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Crear una Nueva Tabla](#crear-una-nueva-tabla)
3. [Agregar Columnas a una Tabla](#agregar-columnas-a-una-tabla)
4. [Eliminar Columnas de una Tabla](#eliminar-columnas-de-una-tabla)
5. [Usar el index.js](#usar-el-indexjs)
6. [Tipos de Datos en Sequelize](#tipos-de-datos-en-sequelize)
7. [Comandos Útiles](#comandos-útiles)

---

## Estructura del Proyecto

```
app/src/
├── models/
│   ├── index.js              ← Archivo principal (conecta BD, carga modelos, define relaciones)
│   ├── barra.js              ← Modelo de barra
│   ├── bebida.js             ← Modelo de bebida
│   ├── venta.js              ← Modelo de venta
│   └── detalleventa.js       ← Modelo de detalle de venta
├── migrations/
│   ├── 20260620183850-inicial.js           ← Crea todas las tablas iniciales
│   └── 20260620192031-agregar-stock.js     ← Ejemplo: agregar columna stock
└── config/
    └── database.cjs          ← Configuración de conexión a PostgreSQL
```

**Flujo de trabajo:**
- **Modelos** (.js): Define la estructura de datos
- **Migraciones** (.js): Script que aplica cambios físicos en la BD
- **index.js**: Conecta todo y exporta lo que necesita la aplicación

---

## Crear una Nueva Tabla

### Paso 1: Crear el Modelo

Crear archivo `app/src/models/producto.js`:

```javascript
'use strict';

export default (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    // Sequelize crea automáticamente 'id' como PRIMARY KEY autoincremental
    
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'productos',      // Nombre en la BD
    timestamps: false,           // Sin createdAt/updatedAt
  });
  
  return Producto;
};
```

**Explicación de opciones:**
- `type`: Tipo de dato (ver tabla de tipos)
- `allowNull`: false = NOT NULL (obligatorio)
- `unique: true`: No permite duplicados
- `defaultValue`: Valor por defecto si no se proporciona
- `tableName`: Nombre real en la BD (plural recomendado)
- `timestamps: false`: Desactiva columnas de fecha automáticas

### Paso 2: Crear la Migración

Ejecutar comando para generar archivo de migración:
```bash
npx sequelize migration:generate --name crear-tabla-productos
```

Editar el archivo generado en `app/src/migrations/` (ejemplo):

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // CREATE TABLE
    await queryInterface.createTable('productos', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });
  },

  async down(queryInterface) {
    // DROP TABLE (deshacer cambio)
    await queryInterface.dropTable('productos');
  },
};
```

### Paso 3: Registrar el Modelo en index.js

Editar `app/src/models/index.js` y agregar:

```javascript
// Después de las importaciones existentes:
import ProductoModel from './producto.js';

// Después de instanciar otros modelos:
const Producto = ProductoModel(sequelize, DataTypes);

// Exportar al final:
export {
  sequelize,
  Sequelize,
  Barra,
  Bebida,
  Venta,
  DetalleVenta,
  Producto,  // ← Agregar esta línea
};
```

### Paso 4: Ejecutar la Migración

```bash
npx sequelize db:migrate
```

Verificar que la tabla se creó:
```bash
# Conectar a PostgreSQL y verificar
\dt productos
```

---

## Agregar Columnas a una Tabla

### Método 1: Crear una Nueva Migración (Recomendado)

#### Ejemplo: Agregar columna 'stock' a la tabla 'bebidas'

Generar migración:
```bash
npx sequelize migration:generate --name agregar-stock-a-bebidas
```

Editar el archivo generado:

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar una columna
    await queryInterface.addColumn('bebidas', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    // Deshacer: eliminar la columna
    await queryInterface.removeColumn('bebidas', 'stock');
  },
};
```

**Opciones comunes al agregar:**
```javascript
{
  type: Sequelize.STRING(100),     // Tipo de dato
  allowNull: false,                // Campo obligatorio
  defaultValue: 'sin definir',     // Valor por defecto para filas existentes
  unique: true,                    // Restricción de unicidad
  comment: 'Comentario en BD',     // Documentación en la BD
}
```

#### Agregar Columna con FK (Foreign Key):

```javascript
await queryInterface.addColumn('detalle_ventas', 'producto_id', {
  type: Sequelize.INTEGER,
  allowNull: false,
  references: {
    model: 'productos',  // Tabla que referencia
    key: 'id',           // Columna clave
  },
  onDelete: 'RESTRICT',  // No permite borrar si hay referencias
  defaultValue: 1,
});
```

### Paso 2: Actualizar el Modelo

Si agregaste columna en Sequelize, actualiza el archivo del modelo:

**app/src/models/bebida.js** - descomentar stock:

```javascript
stock: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0,
},
```

### Paso 3: Ejecutar la Migración

```bash
npx sequelize db:migrate
```

---

## Eliminar Columnas de una Tabla

### Crear una Migración para Eliminar

Generar:
```bash
npx sequelize migration:generate --name eliminar-columna-descripcion
```

Editar:

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar columna
    await queryInterface.removeColumn('bebidas', 'descripcion');
  },

  async down(queryInterface, Sequelize) {
    // Deshacer: volver a crear la columna
    await queryInterface.addColumn('bebidas', 'descripcion', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
```

### Ejecutar:
```bash
npx sequelize db:migrate
```

### Deshacer una Migración (si algo sale mal):
```bash
npx sequelize db:migrate:undo
```

---

## Usar el index.js

El archivo `app/src/models/index.js` es el **corazón** del sistema de modelos. Te muestra cómo funciona:

### ¿Qué hace?

```javascript
// 1. CONECTAR A LA BASE DE DATOS
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 2. CARGAR MODELOS
const Barra = BarraModel(sequelize, DataTypes);
const Bebida = BebidaModel(sequelize, DataTypes);

// 3. DEFINIR RELACIONES (Foreign Keys / Asociaciones)
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'Detalle' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'Venta' });

// 4. EXPORTAR PARA USAR EN TODA LA APP
export { sequelize, Bebida, Venta, ... };
```

### Cómo Usarlo en Otros Archivos

#### Importar modelos:

```javascript
// En routes/ventas.js, services/bebidas.js, etc.
import { Bebida, Venta, DetalleVenta, sequelize } from '../models/index.js';

// Ahora puedes usar:
const bebida = await Bebida.findByPk(1);
const todas = await Bebida.findAll();
await bebida.update({ precio: 15.50 });
```

### Estructura de una Relación en index.js

**Relación Uno a Muchos (1:N):**

```javascript
// Una venta tiene muchos detalles
Venta.hasMany(DetalleVenta, {
  foreignKey: 'venta_id',  // Columna FK en detalle_ventas
  as: 'Detalle',           // Alias para usar en consultas
});

// Un detalle pertenece a una venta
DetalleVenta.belongsTo(Venta, {
  foreignKey: 'venta_id',  // Columna FK
  as: 'Venta',             // Alias
});
```

**Beneficios:**
- Permite `venta.getDetalle()` (Sequelize genera método automático)
- Permite `DetalleVenta.findAll({ include: ['Venta'] })` (JOIN automático)

### Agregar Nuevas Relaciones

Si creas un modelo nuevo, agrega sus relaciones aquí:

```javascript
// Importar modelo
import ProductoModel from './producto.js';
const Producto = ProductoModel(sequelize, DataTypes);

// Agregar relación si aplica
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'Producto' });
Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id', as: 'Detalle' });

// Exportar
export { sequelize, Sequelize, Barra, Bebida, Venta, DetalleVenta, Producto };
```

---

## Tipos de Datos en Sequelize

| Tipo Sequelize | Mapeo PostgreSQL | Uso | Ejemplo |
|---|---|---|---|
| `STRING(n)` | `VARCHAR(n)` | Texto corto | `nombre: STRING(200)` |
| `TEXT` | `TEXT` | Texto largo | `descripcion: TEXT` |
| `INTEGER` | `INTEGER` | Números enteros | `cantidad: INTEGER` |
| `DECIMAL(p,s)` | `NUMERIC(p,s)` | Decimales precisos | `precio: DECIMAL(15,2)` |
| `FLOAT` | `REAL / DOUBLE` | Decimales aprox | Evitar para dinero |
| `BOOLEAN` | `BOOLEAN` | Verdadero/Falso | `activo: BOOLEAN` |
| `DATEONLY` | `DATE` | Solo fecha | `fecha: DATEONLY` |
| `TIME` | `TIME` | Solo hora | `hora: TIME` |
| `DATE` | `TIMESTAMP` | Fecha + hora | `createdAt: DATE` |
| `JSON` | `JSONB` | Objeto JSON | `datos: JSON` |

**Recomendación:** 
- Dinero siempre → `DECIMAL` (nunca FLOAT)
- Fechas/horas → `DATEONLY` o `TIME` según necesites

---

## Comandos Útiles

### Migraciones

```bash
# Ver estado de migraciones
npx sequelize db:migrate:status

# Ejecutar migraciones pendientes
npx sequelize db:migrate

# Deshacer última migración
npx sequelize db:migrate:undo

# Deshacer todas las migraciones
npx sequelize db:migrate:undo:all

# Generar nueva migración
npx sequelize migration:generate --name nombre-descriptivo
```

### Verificar en PostgreSQL

```bash
# Listar tablas
\dt

# Ver estructura de tabla
\d bebidas

# Conectar a la BD
psql -U usuario -d nombre_base_datos -h localhost
```

### Verificar Modelos en Node.js

```javascript
import { Bebida, Venta } from './models/index.js';

// Ver atributos del modelo
console.log(Bebida.rawAttributes);

// Ver relaciones
console.log(Bebida.associations);
```

---

## Checklist: Crear una Tabla Completa

- [ ] Crear archivo modelo en `app/src/models/mimodelo.js`
- [ ] Crear archivo migración: `npx sequelize migration:generate --name crear-tabla-mimodelo`
- [ ] Editar migración con `createTable`
- [ ] Registrar modelo en `app/src/models/index.js` (import + instanciar + export)
- [ ] Agregar relaciones en `index.js` si aplica
- [ ] Ejecutar migración: `npx sequelize db:migrate`
- [ ] Verificar en PostgreSQL: `\dt mimodelo`
- [ ] Probar en código: `const todos = await MiModelo.findAll()`

---

## Ejemplo Completo: Tabla de Proveedores

### 1. Modelo: `app/src/models/proveedor.js`

```javascript
'use strict';

export default (sequelize, DataTypes) => {
  const Proveedor = sequelize.define('Proveedor', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'proveedores',
    timestamps: false,
  });
  
  return Proveedor;
};
```

### 2. Migración: `app/src/migrations/20260622-crear-proveedores.js`

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedores', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('proveedores');
  },
};
```

### 3. Registrar en `app/src/models/index.js`

```javascript
import ProveedorModel from './proveedor.js';

// ...instanciar...
const Proveedor = ProveedorModel(sequelize, DataTypes);

// ...exportar...
export { sequelize, Sequelize, Barra, Bebida, Venta, DetalleVenta, Proveedor };
```

### 4. Ejecutar
```bash
npx sequelize db:migrate
```

¡Tabla lista para usar! 🎉

---

## Notas Importantes

⚠️ **Nunca** modificar directamente la BD sin migraciones - siempre usar migraciones.

⚠️ **Siempre** descomentar/comentar campos en el modelo cuando agregas/eliminas columnas.

⚠️ **Orden en DOWN()**: Eliminar en orden inverso (tablas con FK primero).

⚠️ **defaultValue** en migraciones: Necesario para las filas que ya existen.

✅ **Buena práctica**: Nombres en minúsculas_con_guiones en BD, camelCase en modelos.
