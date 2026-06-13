// src/models/barra.js
'use strict';
export default (sequelize, DataTypes) => {
  const Barra = sequelize.define('Barra', {
    numero_barra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  }, {
    tableName: 'barras',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.sector) instance.sector = instance.sector.toUpperCase();
      },
    },
  });
  return Barra;
};
