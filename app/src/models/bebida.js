'use strict'; // Habilita el modo estricto de JavaScript para evitar errores comunes y optimizar la ejecución.

// Exporta una función fábrica que recibe la conexión activa (sequelize) y los tipos de datos (DataTypes).
export default (sequelize, DataTypes) => {
  // Registra el modelo 'Bebida' en Sequelize.
  const Bebida = sequelize.define('Bebida', {
    // Nota: Sequelize creará automáticamente la columna autoincremental 'id' como clave primaria si no se define una.

    nombre: {
      type: DataTypes.STRING(200), // Mapea a VARCHAR(200) en PostgreSQL para guardar el nombre de la bebida.
      allowNull: false,            // Restricción NOT NULL en la base de datos (campo obligatorio).
      unique: true,                // Restricción de unicidad para evitar nombres duplicados.
    },
    precio: {
      type: DataTypes.DECIMAL(15, 2), // Mapea a NUMERIC(15,2) en PostgreSQL, garantizando precisión exacta para dinero.
      allowNull: false,               // Restricción NOT NULL.
      defaultValue: 0,                // Valor predeterminado en cero si no se proporciona al crear la bebida.
    },
    // NOTA SOBRE EL STOCK:
    // Esta propiedad está comentada en el mapeo de Sequelize. Si la base de datos ya tiene la columna 'stock',
    // Sequelize la ignorará por completo. Para activarla, se debe descomentar este bloque tras correr la migración.
     stock: {
       type: DataTypes.INTEGER,
       allowNull: false,
       defaultValue: 0,
    },
    descripcion: {
      type: DataTypes.TEXT, // Mapea a una columna de tipo TEXT en PostgreSQL (sin límite de caracteres).
      allowNull: true,      // Permite valores NULL (campo opcional).
    },
  }, {
    tableName: 'bebidas', // Nombre real de la tabla física en la base de datos PostgreSQL.
    timestamps: false,    // Desactiva la creación y gestión automática de 'createdAt' y 'updatedAt'.

    // Hooks de Sequelize para automatizar transformaciones previas a la persistencia.
    hooks: {
      // beforeSave se dispara antes de ejecutar un 'INSERT' o 'UPDATE' en la base de datos.
      beforeSave: (instance) => {
        // Convierte el nombre de la bebida a letras mayúsculas antes de guardarlo.
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Bebida; // Retorna el modelo Bebida inicializado.
};
