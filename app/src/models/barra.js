// src/models/barra.js
'use strict'; // Habilita el modo estricto de JavaScript para prevenir errores y mejorar el rendimiento.

// Exporta por defecto una función fábrica que recibe la instancia de sequelize y DataTypes.
// Esto permite instanciar el modelo pasando la conexión configurada desde index.js.
export default (sequelize, DataTypes) => {
  // Define el modelo 'Barra' que representa la entidad en Sequelize.
  const Barra = sequelize.define('Barra', {
    // Clave primaria implícita: Sequelize agregará automáticamente una columna 'id' como SERIAL PRIMARY KEY si no se declara explícitamente.

    numero_barra: {
      type: DataTypes.INTEGER, // Define el tipo de dato como un entero (INTEGER).
      allowNull: false,        // Agrega la restricción NOT NULL en la base de datos (campo requerido).
      unique: true,            // Agrega un índice de unicidad para evitar que haya dos barras con el mismo número.
    },
    sector: {
      type: DataTypes.STRING(100), // Mapea a una columna VARCHAR(100) en PostgreSQL para almacenar el sector de la barra.
      allowNull: false,            // Restricción NOT NULL (campo requerido).
    },
  }, {
    tableName: 'barras', // Indica explícitamente el nombre de la tabla física en PostgreSQL.
    timestamps: false,   // Desactiva las columnas de auditoría automática 'createdAt' y 'updatedAt' de Sequelize.

    // Configuración de ganchos de ciclo de vida (hooks) del modelo.
    hooks: {
      // beforeSave se ejecuta automáticamente antes de insertar (create) o actualizar (update) un registro en la DB.
      beforeSave: (instance) => {
        // Si el sector tiene un valor, se convierte automáticamente a mayúsculas para mantener consistencia.
        if (instance.sector) instance.sector = instance.sector.toUpperCase();
      },
    },
  });
  return Barra; // Retorna la instancia del modelo Barra ya registrado en Sequelize.
};
