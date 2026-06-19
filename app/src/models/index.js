// src/models/index.js
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConfig from '../config/database.cjs';

// Resolución de rutas absolutas para compatibilidad con ES Modules (módulos nativos de Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determina el entorno de ejecución actual (por defecto 'development' si no está definido en NODE_ENV)
const env = process.env.NODE_ENV || 'development';
// Obtiene la configuración de base de datos específica para el entorno (desarrollo, testing o producción)
const config = dbConfig[env];

// Instancia la conexión a la base de datos PostgreSQL utilizando los parámetros configurados
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Importa las funciones fábrica de cada uno de los modelos del sistema
import BarraModel from './barra.js';
import BebidaModel from './bebida.js';
import VentaModel from './venta.js';
import DetalleVentaModel from './detalleventa.js';

// Inicializa cada modelo inyectándoles la instancia de conexión única (sequelize) y los tipos de datos (DataTypes)
const Barra = BarraModel(sequelize, DataTypes);
const Bebida = BebidaModel(sequelize, DataTypes);
const Venta = VentaModel(sequelize, DataTypes);
const DetalleVenta = DetalleVentaModel(sequelize, DataTypes);

// CONFIGURACIÓN DE RELACIONES Y ASOCIACIONES (Foreign Keys / Claves Foráneas)
// Estas asociaciones permiten a Sequelize realizar JOINS automáticos y proveer métodos auxiliares.

// 1. Relación Venta <-> DetalleVenta (Uno a Muchos)
// Indica que una venta puede tener múltiples detalles de venta. La FK física en detalle_ventas es 'venta_id'.
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'Detalle' });
// Indica que cada detalle de venta pertenece a una venta única y principal.
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'Venta' });

// 2. Relación Bebida <-> DetalleVenta (Uno a Muchos)
// Cada detalle de venta pertenece a una bebida específica vendida. La FK es 'bebida_id'.
DetalleVenta.belongsTo(Bebida, { foreignKey: 'bebida_id', as: 'Bebida' });
// Una bebida puede estar presente en muchos detalles de ventas a lo largo del tiempo.
Bebida.hasMany(DetalleVenta, { foreignKey: 'bebida_id', as: 'Detalle' });

// 3. Relación Barra <-> DetalleVenta (Uno a Muchos)
// Cada detalle de venta se despacha desde una barra específica. La FK es 'barra_id'.
DetalleVenta.belongsTo(Barra, { foreignKey: 'barra_id', as: 'Barra' });
// Una barra física puede procesar/despachar muchos detalles de ventas.
Barra.hasMany(DetalleVenta, { foreignKey: 'barra_id', as: 'Detalle' });

// Exporta la instancia de conexión activa y todos los modelos configurados para su consumo global en la aplicación
export {
  sequelize,
  Sequelize,
  Barra,
  Bebida,
  Venta,
  DetalleVenta,
};
