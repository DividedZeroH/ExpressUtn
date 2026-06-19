# Guía de Migraciones en Sequelize: Creación y Modificación de Tablas

Este documento explica de forma clara y con ejemplos prácticos cómo gestionar la creación y alteración del esquema de base de datos PostgreSQL utilizando **Sequelize Migrations**. 

Las migraciones funcionan como un "control de versiones" para tu base de datos, registrando de manera incremental cada cambio realizado en la estructura.

---

## 1. Estructura Básica de una Migración

Cada archivo de migración exporta un objeto con dos métodos asíncronos:
* **`up`**: Contiene las instrucciones para aplicar los cambios a la base de datos (por ejemplo, crear una tabla o agregar una columna).
* **`down`**: Contiene las instrucciones para revertir exactamente los cambios aplicados en el método `up` (por ejemplo, borrar la tabla o quitar la columna).

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Código para aplicar cambios
  },

  async down(queryInterface, Sequelize) {
    // Código para deshacer cambios
  }
};
```

---

## 2. Ejemplo Práctico: Creación de Tablas (`001-initial.js`)

A continuación, se muestra cómo se utiliza `queryInterface.createTable` para generar la estructura inicial de base de datos para nuestro bar.

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Creación de la tabla 'barras'
    await queryInterface.createTable('barras', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      numero_barra: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        unique: true 
      },
      sector: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
    });

    // 2. Creación de la tabla 'bebidas'
    await queryInterface.createTable('bebidas', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      nombre: { 
        type: Sequelize.STRING(200), 
        allowNull: false 
      },
      precio: { 
        type: Sequelize.DECIMAL(15, 2), 
        allowNull: false, 
        defaultValue: 0 
      },
      descripcion: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
    });

    // 3. Creación de la tabla intermedia 'detalle_ventas' con Foreign Keys (FK)
    await queryInterface.createTable('detalle_ventas', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      venta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { 
          model: 'ventas', // Nombre de la tabla destino
          key: 'id'        // Columna destino
        },
        onDelete: 'RESTRICT', // Evita borrar ventas que tengan detalles asociados
      },
      bebida_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'bebidas', key: 'id' },
        onDelete: 'RESTRICT',
      },
      cantidad: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 1 
      },
      subtotal: { 
        type: Sequelize.DECIMAL(15, 2), 
        allowNull: false, 
        defaultValue: 0 
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Para revertir, eliminamos las tablas en el orden inverso al de creación 
    // (evitando conflictos de claves foráneas)
    await queryInterface.dropTable('detalle_ventas');
    await queryInterface.dropTable('bebidas');
    await queryInterface.dropTable('barras');
  }
};
```

---

## 3. Ejemplo Práctico: Modificación de Tablas (Agregar Columna)

Cuando la base de datos ya está creada y en funcionamiento, **no debemos modificar la migración inicial**. En su lugar, creamos una nueva migración incremental usando `queryInterface.addColumn`.

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Añade la columna 'stock' a la tabla 'bebidas'
    await queryInterface.addColumn('bebidas', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0 // Importante para rellenar filas existentes sin violar 'NOT NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Deshace el cambio quitando la columna
    await queryInterface.removeColumn('bebidas', 'stock');
  }
};
```

---

## 4. Comandos Esenciales de la Consola

Recuerda posicionarte siempre dentro de la carpeta `/app` donde está configurado tu proyecto Node antes de correr estos comandos:

| Acción | Comando | Descripción |
| :--- | :--- | :--- |
| **Crear migración** | `npx sequelize-cli migration:generate --name nombre-migracion` | Crea un archivo de migración vacío con marca de tiempo. |
| **Correr migraciones** | `npx sequelize-cli db:migrate` | Ejecuta todos los archivos `up()` pendientes en la base de datos. |
| **Deshacer última** | `npx sequelize-cli db:migrate:undo` | Ejecuta el método `down()` del último archivo aplicado. |
| **Deshacer todas** | `npx sequelize-cli db:migrate:undo:all` | Revierte la base de datos por completo ejecutando todos los `down()`. |

---

## 5. Buenas Prácticas

1. **Inmutabilidad:** Las migraciones ya ejecutadas y subidas a producción o entornos compartidos son sagradas. No las edites; si necesitas un cambio, genera otra migración.
2. **Coherencia con los Modelos:** Si creas una tabla o agregas una columna en la base de datos mediante migraciones, debes actualizar el modelo de Sequelize en JavaScript para mapearla.
3. **Siempre incluir el método `down`:** Nunca dejes el método `down` vacío. Un rollback fallido en producción puede causar dolores de cabeza muy grandes.
