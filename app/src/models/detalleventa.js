// src/models/detalleventa.js
'use strict';
export default (sequelize, DataTypes) => {
  const DetalleVenta = sequelize.define('DetalleVenta', {
    venta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bebida_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    barra_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'detalle_ventas',
    timestamps: false,
  });
  return DetalleVenta;
};
