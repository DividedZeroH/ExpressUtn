# Guía Paso a Paso: Mapeo, Migración y Modificación de Modelos en Sequelize

Esta guía te enseñará cómo funciona el mapeo objeto-relacional (ORM) en **Sequelize**, detallará el código de modelos de tu aplicación y te guiará paso a paso sobre cómo agregar una nueva columna en una tabla existente de la base de datos PostgreSQL, realizar su mapeo y ejecutar la migración correspondiente de forma segura.

---

## 1. Conceptos Fundamentales: Modelos, Tablas y Migraciones

En el desarrollo web moderno con Node.js, es sumamente común utilizar un **ORM (Object-Relational Mapping)** como Sequelize para interactuar con bases de datos relacionales sin tener que escribir sentencias SQL manuales todo el tiempo.

### Componentes Clave:
1. **La Base de Datos (PostgreSQL)**: El almacenamiento físico real. Contiene tablas con columnas, tipos de datos, índices y claves foráneas físicas.
2. **El Modelo (Código JavaScript)**: La representación lógica de una tabla en tu aplicación. Sequelize utiliza esta definición para saber qué campos existen en JavaScript, cómo validarlos antes de guardar, y cómo formatear los datos de las consultas SQL que genera automáticamente.
3. **La Migración (Control de Versiones de la DB)**: Archivos de scripts JS autónomos que describen cambios incrementales en el esquema de la base de datos (por ejemplo, crear una tabla, añadir una columna, borrar un índice).

> [!IMPORTANT]
> **La Regla de Oro de la Sincronización:**
> Para que un nuevo atributo funcione, debe estar definido **tanto en la base de datos (a través de una migración)** como **en el modelo de Sequelize (a través del código de mapeo)**.
> - Si solo agregas la columna a la base de datos, Sequelize la ignorará por completo y no podrás usarla en tu código.
> - Si solo agregas el atributo al modelo de Sequelize sin haber corrido la migración, la aplicación fallará con un error de tipo `column does not exist` al intentar hacer consultas.

---

## 2. Comentarios Detallados del Código Existente

A continuación, analizamos los archivos principales del sistema de modelos del proyecto, explicando detalladamente qué hace cada sección de código.

### A. Modelo de Bebida (`app/src/models/bebida.js`)

Este archivo define la estructura lógica de la entidad `Bebida` para Sequelize.

```javascript
'use strict';
export default (sequelize, DataTypes) => {
  // Define el modelo 'Bebida'. Sequelize asociará esto automáticamente
  // con la tabla física indicada en las opciones.
  const Bebida = sequelize.define('Bebida', {
    
    // Atributo: nombre de la bebida
    nombre: {
      type: DataTypes.STRING(200), // Mapea a VARCHAR(200) en PostgreSQL
      allowNull: false,            // Aplica la restricción NOT NULL
      unique: true,                // Crea un índice único (no nombres repetidos)
    },
    
    // Atributo: precio de la bebida
    precio: {
      type: DataTypes.DECIMAL(15, 2), // Mapea a NUMERIC(15,2) (perfecto para importes de dinero)
      allowNull: false,               // Restricción NOT NULL
      defaultValue: 0,                // Si no se asigna al crear, por defecto vale 0
    },
    
    // COMENTADO: Este campo representa la columna de stock. 
    // Aunque exista la columna en PostgreSQL físicamente, al estar comentada aquí,
    // Sequelize NO la incluirá en sus selects ni updates en memoria.
    // stock: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   defaultValue: 0,
    // },
    
    // Atributo: descripción detallada de la bebida
    descripcion: {
      type: DataTypes.TEXT, // Mapea a TEXT en PostgreSQL (texto de longitud ilimitada)
      allowNull: true,      // Permite valores nulos (campo opcional)
    },
    
  }, {
    tableName: 'bebidas',  // Nombre real de la tabla física en la base de datos
    timestamps: false,     // Desactiva la creación automática de 'createdAt' y 'updatedAt'
    
    // Hooks: Funciones que se ejecutan automáticamente en el ciclo de vida del modelo
    hooks: {
      // Antes de guardar un registro (crear o actualizar), transforma el nombre a mayúsculas
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  
  return Bebida;
};
```

---

### B. Inicializador de Modelos (`app/src/models/index.js`)

Este archivo es el corazón del ORM. Se encarga de levantar la conexión, registrar los modelos y establecer las relaciones (claves foráneas) entre ellos.

```javascript
// src/models/index.js
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConfig from '../config/database.cjs';

// Resolución de rutas en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determina el entorno de ejecución (por defecto 'development')
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env]; // Obtiene la configuración de conexión correspondiente

// Inicializa la conexión física a la Base de Datos utilizando los parámetros de config
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Importa las funciones fábrica de cada modelo
import BarraModel from './barra.js';
import BebidaModel from './bebida.js';
import VentaModel from './venta.js';
import DetalleVentaModel from './detalleventa.js';

# Inicializa los modelos pasándoles la conexión y los DataTypes
const Barra = BarraModel(sequelize, DataTypes);
const Bebida = BebidaModel(sequelize, DataTypes);
const Venta = VentaModel(sequelize, DataTypes);
const DetalleVenta = DetalleVentaModel(sequelize, DataTypes);

# DEFINICIÓN DE RELACIONES (Claves Foráneas - Foreign Keys)
# 1. Relación Ventas <-> DetalleVenta
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'Detalle' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'Venta' });

# 2. Relación Bebidas <-> DetalleVenta
Bebida.hasMany(DetalleVenta, { foreignKey: 'bebida_id', as: 'Detalle' });
DetalleVenta.belongsTo(Bebida, { foreignKey: 'bebida_id', as: 'Bebida' });

# 3. Relación Barras <-> DetalleVenta
Barra.hasMany(DetalleVenta, { foreignKey: 'barra_id', as: 'Detalle' });
DetalleVenta.belongsTo(Barra, { foreignKey: 'barra_id', as: 'Barra' });

// Exporta la conexión activa y los modelos ya configurados
export {
  sequelize,
  Sequelize,
  Barra,
  Bebida,
  Venta,
  DetalleVenta,
};
```

---

## 3. Guía de Ejecución: Cómo agregar una nueva columna

Supongamos que deseas activar el control de **stock** en tus bebidas. Para agregarlo de manera profesional a tu base de datos y a tu modelo de Sequelize, debes seguir detalladamente el flujo que explicamos a continuación.

```
                    FLUJO DE CAMBIO EN LA BASE DE DATOS
                    
  1. CLI: Generar        2. Editar Archivo      3. CLI: Ejecutar
     Migración Vacía        de Migración           la Migración
  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │ npx sequelize... │ ─>│ queryInterface...│ ─>│ npx sequelize... │
  │ migration:gen    │   │ .addColumn(...)  │   │ db:migrate       │
  └──────────────────┘   └──────────────────┘   └──────────────────┘
                                                          │
                                                          ▼
  5. ¡Listo! Usar en     4. Modificar el        (Verificar en DB /
     la Aplicación          Modelo en JS          Panel AdminJS)
  ┌──────────────────┐   ┌──────────────────┐
  │ Bebida.stock     │ <─│ stock: {         │
  │                  │   │   type: ...      │
  └──────────────────┘   └└─────────────────┘
```

### Paso 1: Generar una nueva migración
En entornos profesionales, **nunca debes editar un archivo de migración antiguo** que ya haya sido ejecutado en producción o en el equipo de tus compañeros de desarrollo. Modificar archivos antiguos arruina el historial del esquema y genera conflictos graves. 

En su lugar, debes generar un nuevo archivo de migración vacío ejecutando el siguiente comando en la consola (desde el directorio `app` del proyecto):

```bash
npx sequelize-cli migration:generate --name agregar-stock-bebidas
```

Esto generará un archivo dentro de la carpeta `app/src/migrations/` con un nombre similar a:
`20260616180155-agregar-stock-bebidas.js` (el prefijo numérico representa la fecha y hora exacta de creación).

---

### Paso 2: Programar la migración (`up` y `down`)
Abre el archivo recién creado. Verás una estructura básica con dos métodos asíncronos: `up` (lo que ocurre cuando aplicas la migración) y `down` (lo que ocurre si decides deshacerla para volver al estado anterior).

Edítalo para que quede estructurado de la siguiente manera:

```javascript
'use strict';

module.exports = {
  // up: Define qué cambios se aplicarán en la Base de Datos
  async up(queryInterface, Sequelize) {
    // Agrega una columna a la tabla 'bebidas' llamada 'stock'
    await queryInterface.addColumn('bebidas', 'stock', {
      type: Sequelize.INTEGER,     // Tipo de dato entero
      allowNull: false,            // Restricción NOT NULL
      defaultValue: 0,             // Valor por defecto en los registros existentes
    });
  },

  // down: Define cómo revertir los cambios exactos aplicados en el método 'up'
  async down(queryInterface, Sequelize) {
    # Elimina la columna 'stock' de la tabla 'bebidas'
    await queryInterface.removeColumn('bebidas', 'stock');
  },
};
```

> [!NOTE]
> **Explicación técnica de la configuración de columna:**
> - `type: Sequelize.INTEGER`: Indica que la columna guardará enteros.
> - `allowNull: false`: Obliga a que todos los registros tengan un número de stock asignado.
> - `defaultValue: 0`: Clave para registros existentes. Al añadir una columna no nula (`NOT NULL`) a una tabla con datos preexistentes, PostgreSQL necesita saber qué valor ponerle a esos registros para que la restricción no falle. Aquí le asignamos `0`.

---

### Paso 3: Ejecutar la migración en la Base de Datos
Para aplicar físicamente la columna nueva en la tabla de PostgreSQL en tu contenedor Docker o entorno local, ejecuta el siguiente comando:

```bash
npx sequelize-cli db:migrate
```

**¿Qué hace Sequelize tras bambalinas?**
1. Busca en la base de datos una tabla interna llamada `SequelizeMeta`.
2. Lee los nombres de los archivos en tu carpeta `migrations` y los compara con los registros de `SequelizeMeta`.
3. Ejecuta la función `up()` únicamente de los archivos que no figuren en la tabla.
4. Si la ejecución es exitosa, guarda el nombre de la migración en `SequelizeMeta` para evitar que vuelva a correrse en el futuro.

---

### Paso 4: Realizar el mapeo de la columna en el modelo Sequelize
Ahora que la base de datos física ya tiene la columna `stock`, necesitamos indicarle al modelo en JavaScript que puede utilizarla.

Para esto, abrimos el archivo del modelo `app/src/models/bebida.js` y descomentamos o agregamos las líneas correspondientes dentro del esquema del modelo:

```diff
  const Bebida = sequelize.define('Bebida', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    precio: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
-   // stock: {
-   //   type: DataTypes.INTEGER,
-   //   allowNull: false,
-   //   defaultValue: 0,
-   // },
+   stock: {
+     type: DataTypes.INTEGER,
+     allowNull: false,
+     defaultValue: 0,
+   },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
```

Una vez guardado el archivo, la aplicación Express y cualquier consulta que realices (por ejemplo, `Bebida.findAll()`) incluirán automáticamente la columna `stock` en los objetos JSON devueltos y mapeados.

---

### Paso 5: ¿Cómo revertir la migración si hay problemas? (Rollback)
Si por algún motivo cometiste un error de sintaxis en el tipo de dato, asignaste mal el valor por defecto o deseas retirar la columna, puedes deshacer el último paso fácilmente ejecutando:

```bash
npx sequelize-cli db:migrate:undo
```

**¿Qué hace este comando?**
1. Consulta la tabla `SequelizeMeta` para ver cuál fue la última migración aplicada con éxito.
2. Ejecuta la función `down()` de dicho archivo de migración (en nuestro caso, llamará a `queryInterface.removeColumn('bebidas', 'stock')`).
3. Borra el registro correspondiente en la tabla `SequelizeMeta`.

Una vez ejecutado, puedes modificar el código de la migración si es necesario y volver a correr `npx sequelize-cli db:migrate` para aplicarla correctamente.

---

## 4. Tabla de Equivalencias de Tipos de Datos Comunes

Para ayudarte a mapear tus modelos y migraciones de forma óptima, te compartimos la equivalencia de los tipos de datos principales entre Sequelize (JavaScript) y PostgreSQL:

| Tipo en Sequelize (`DataTypes.*`) | Columna en PostgreSQL | Ejemplo de Uso Práctico |
| :--- | :--- | :--- |
| `INTEGER` | `INTEGER` | Cantidades enteras (ej. `stock`, `cantidad`) |
| `DECIMAL(precision, escala)` | `NUMERIC(precision, escala)` | Dinero / Importes (ej. `precio`, `total`) |
| `STRING(n)` | `VARCHAR(n)` | Textos cortos (ej. `nombre`, `sector`) |
| `TEXT` | `TEXT` | Descripciones largas (ej. `comentarios`, `observaciones`) |
| `BOOLEAN` | `BOOLEAN` | Estados Sí/No (ej. `activo`, `disponible`) |
| `DATE` | `TIMESTAMP WITH TIME ZONE` | Fechas con hora exacta (ej. `createdAt`, `fecha_venta`) |
| `DATEONLY` | `DATE` | Fechas puras sin hora (ej. `fecha_nacimiento`) |

---

## 5. Buenas Prácticas al Trabajar con Migraciones en Sequelize

* **Inmutabilidad:** Jamás alteres una migración que ya fue aplicada en bases de datos compartidas. Si necesitas un cambio, genera una nueva migración.
* **Proveer siempre un método `down` completo:** Es vital para poder deshacer cambios si ocurren problemas en producción. Si en `up` creas una tabla, en `down` debes eliminarla (`dropTable`). Si en `up` añades una columna, en `down` debes quitarla (`removeColumn`).
* **Sincronización:** Asegúrate siempre de que las restricciones definidas en el archivo de migración (`allowNull`, `defaultValue`, `unique`) sean idénticas a las configuradas en el modelo de Sequelize.
