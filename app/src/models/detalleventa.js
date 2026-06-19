'use strict'; // Habilita el modo estricto de JS para optimizar rendimiento y reportar malas prácticas.

// Exporta la función fábrica del modelo DetalleVenta.
export default (sequelize, DataTypes) => {
  // Define el modelo 'DetalleVenta' que representará las líneas o ítems de cada venta.
  const DetalleVenta = sequelize.define('DetalleVenta', {
    // Clave primaria implícita 'id' generada automáticamente por Sequelize.

    venta_id: {
      type: DataTypes.INTEGER, // Guarda la relación con el ID de la venta padre.
      allowNull: false,        // Restricción NOT NULL.
      // Nota: Aunque es una FK, no requiere la configuración 'references' aquí en el modelo si se
      // define la asociación de manera explícita en index.js usando belongsTo.
    },
    bebida_id: {
      type: DataTypes.INTEGER, // Guarda la relación con el ID de la bebida vendida.
      allowNull: false,        // Restricción NOT NULL.
    },
    barra_id: {
      type: DataTypes.INTEGER, // Guarda la relación con la barra desde la cual se realizó el despacho.
      allowNull: false,        // Restricción NOT NULL.
    },
    cantidad: {
      type: DataTypes.INTEGER, // Cantidad de unidades de la bebida vendidas en esta línea.
      allowNull: false,        // Restricción NOT NULL.
      defaultValue: 1,         // Por defecto, si no se especifica, se asume que se vendió 1 unidad.
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2), // Mapea a NUMERIC(15,2) para el importe total calculado (cantidad * precio_bebida).
      allowNull: false,               // Restricción NOT NULL.
      defaultValue: 0,                // Valor inicial predeterminado en cero.
    },
  }, {
    tableName: 'detalle_ventas', // Mapea este modelo a la tabla 'detalle_ventas' de PostgreSQL.
    timestamps: false,           // Desactiva columnas automáticas 'createdAt' y 'updatedAt'.
  });
  return DetalleVenta; // Retorna el modelo DetalleVenta.
};
