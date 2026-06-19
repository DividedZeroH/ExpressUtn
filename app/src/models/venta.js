// src/models/venta.js
'use strict'; // Modo estricto de JS para evitar errores latentes y forzar sintaxis correcta.

// Exporta la función fábrica para inyectar la conexión (sequelize) y los tipos de datos (DataTypes).
export default (sequelize, DataTypes) => {
  // Define la entidad 'Venta' en Sequelize.
  const Venta = sequelize.define('Venta', {
    // Clave primaria implícita 'id' autoincremental de tipo INTEGER será agregada por Sequelize automáticamente.

    numero_venta: {
      type: DataTypes.INTEGER, // Tipo de dato entero para el identificador único de factura/ticket.
      allowNull: false,        // Restricción NOT NULL (campo obligatorio).
      unique: true,            // Evita que existan dos registros de venta con el mismo número.
    },
    fecha: {
      type: DataTypes.DATEONLY, // Mapea a tipo DATE en PostgreSQL (guarda solo fecha AAAA-MM-DD sin información horaria).
      allowNull: false,         // Restricción NOT NULL.
    },
    hora: {
      type: DataTypes.TIME, // Mapea a tipo TIME en PostgreSQL (guarda la hora HH:MM:SS de la transacción).
      allowNull: false,     // Restricción NOT NULL.
    },
    total: {
      type: DataTypes.DECIMAL(15, 2), // Mapea a NUMERIC(15,2) en PostgreSQL para evitar errores de coma flotante en los importes.
      allowNull: false,               // Restricción NOT NULL.
      defaultValue: 0,                // Inicializa el total en cero por defecto.
    },
  }, {
    tableName: 'ventas', // Mapea este modelo de manera explícita a la tabla 'ventas' en la DB.
    timestamps: false,   // No añade columnas de auditoría automática 'createdAt' y 'updatedAt'.
  });
  return Venta; // Retorna el modelo Venta.
};
