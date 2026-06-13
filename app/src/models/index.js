// src/models/index.js
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConfig from '../config/database.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

import BarraModel      from './barra.js';
import BebidaModel     from './bebida.js';
import VentaModel      from './venta.js';
import DetalleVentaModel from './detalleventa.js';

const Barra       = BarraModel(sequelize, DataTypes);
const Bebida      = BebidaModel(sequelize, DataTypes);
const Venta       = VentaModel(sequelize, DataTypes);
const DetalleVenta = DetalleVentaModel(sequelize, DataTypes);

Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'Detalle' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'Venta' });

DetalleVenta.belongsTo(Bebida, { foreignKey: 'bebida_id', as: 'Bebida' });
Bebida.hasMany(DetalleVenta, { foreignKey: 'bebida_id', as: 'Detalle' });

DetalleVenta.belongsTo(Barra, { foreignKey: 'barra_id', as: 'Barra' });
Barra.hasMany(DetalleVenta, { foreignKey: 'barra_id', as: 'Detalle' });

export {
  sequelize,
  Sequelize,
  Barra,
  Bebida,
  Venta,
  DetalleVenta,
};
