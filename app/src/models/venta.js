// src/models/venta.js
'use strict';
export default (sequelize, DataTypes) => {
  const Venta = sequelize.define('Venta', {
    numero_venta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'ventas',
    timestamps: false,
  });
  return Venta;
};
