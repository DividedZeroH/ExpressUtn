// src/models/bebida.js
'use strict';
export default (sequelize, DataTypes) => {
  const Bebida = sequelize.define('Bebida', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'bebidas',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Bebida;
};
