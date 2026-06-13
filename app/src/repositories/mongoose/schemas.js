// src/repositories/mongoose/schemas.js
//
// Equivalente Mongoose de los modelos Sequelize de src/models/.
// Mismos campos y mismas colecciones (nombres de tabla → nombres de colección),
// para que el resto del código no note la diferencia de ORM.
//
// Notas de mapeo Sequelize → Mongoose:
//   DECIMAL → Number          DATEONLY → String (YYYY-MM-DD)
//   TIME    → String (HH:mm)  hooks beforeSave (UPPER) → setters del schema

import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const barraSchema = new Schema({
  numero_barra: { type: Number, required: true, unique: true },
  sector:       { type: String, required: true, set: (v) => (v ? String(v).toUpperCase() : v) },
}, { collection: 'barras', versionKey: false });

const bebidaSchema = new Schema({
  nombre:      { type: String, required: true, set: (v) => (v ? String(v).toUpperCase() : v) },
  precio:      { type: Number, required: true, default: 0 },
  descripcion: { type: String, default: null },
}, { collection: 'bebidas', versionKey: false });

const ventaSchema = new Schema({
  numero_venta: { type: Number, required: true, unique: true },
  fecha:        { type: String, required: true }, // DATEONLY → 'YYYY-MM-DD'
  hora:         { type: String, required: true }, // TIME     → 'HH:mm:ss'
  total:        { type: Number, required: true, default: 0 },
}, { collection: 'ventas', versionKey: false });

const detalleVentaSchema = new Schema({
  venta_id:  { type: Schema.Types.Mixed, required: true, ref: 'Venta' },
  bebida_id: { type: Schema.Types.Mixed, required: true, ref: 'Bebida' },
  barra_id:  { type: Schema.Types.Mixed, required: true, ref: 'Barra' },
  cantidad:  { type: Number, required: true, default: 1 },
  subtotal:  { type: Number, required: true, default: 0 },
}, { collection: 'detalle_ventas', versionKey: false });

// `models.X || model('X', ...)` evita OverwriteModelError al recargar con --watch.
export const BarraModel        = models.Barra        || model('Barra', barraSchema);
export const BebidaModel       = models.Bebida       || model('Bebida', bebidaSchema);
export const VentaModel        = models.Venta        || model('Venta', ventaSchema);
export const DetalleVentaModel = models.DetalleVenta || model('DetalleVenta', detalleVentaSchema);
