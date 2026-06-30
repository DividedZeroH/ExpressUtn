// src/repositories/mongoose/schemas.js
//
// Equivalente Mongoose de los modelos Sequelize de src/models/.
// Mismos campos y mismas colecciones (nombres de tabla → nombres de colección),
// para que el resto del código no note la diferencia de ORM.
//
// CLAVE: cada documento expone un campo numérico `id` (autoincremental, gestionado
// por counter.js) en vez del ObjectId `_id` de Mongo. Así la API REST sigue
// funcionando con ids enteros (`/api/bebidas/1`) y las validaciones de FK de los
// servicios (que esperan enteros) no cambian al pasar de Sequelize a Mongoose.
// El `_id` interno de Mongo se oculta en la salida JSON.
//
// Notas de mapeo Sequelize → Mongoose:
//   DECIMAL → Number          DATEONLY → String (YYYY-MM-DD)
//   TIME    → String (HH:mm)  hooks beforeSave (UPPER) → setters del schema

import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

// Oculta `_id` y `__v` en la salida JSON, dejando solo el `id` numérico.
// Replica la forma de respuesta de Sequelize (que devuelve `id`).
function ocultarInternos(schema) {
  schema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
  });
}

const barraSchema = new Schema({
  id:           { type: Number, unique: true, index: true },
  numero_barra: { type: Number, required: true, unique: true },
  sector:       { type: String, required: true, set: (v) => (v ? String(v).toUpperCase() : v) },
}, { collection: 'barras', versionKey: false });

const bebidaSchema = new Schema({
  id:          { type: Number, unique: true, index: true },
  nombre:      { type: String, required: true, set: (v) => (v ? String(v).toUpperCase() : v) },
  precio:      { type: Number, required: true, default: 0 },
  descripcion: { type: String, default: null },
  // En NoSQL no hace falta migración para agregar la columna: el campo simplemente existe.
  stock:       { type: Number, default: null },
}, { collection: 'bebidas', versionKey: false });

const ventaSchema = new Schema({
  id:           { type: Number, unique: true, index: true },
  numero_venta: { type: Number, required: true, unique: true },
  fecha:        { type: String, required: true }, // DATEONLY → 'YYYY-MM-DD'
  hora:         { type: String, required: true }, // TIME     → 'HH:mm:ss'
  total:        { type: Number, required: true, default: 0 },
}, { collection: 'ventas', versionKey: false });

const detalleVentaSchema = new Schema({
  id:        { type: Number, unique: true, index: true },
  venta_id:  { type: Number, required: true },
  bebida_id: { type: Number, required: true },
  barra_id:  { type: Number, required: true },
  cantidad:  { type: Number, required: true, default: 1 },
  subtotal:  { type: Number, required: true, default: 0 },
}, { collection: 'detalle_ventas', versionKey: false });

[barraSchema, bebidaSchema, ventaSchema, detalleVentaSchema].forEach(ocultarInternos);

// `models.X || model('X', ...)` evita OverwriteModelError al recargar con --watch.
export const BarraModel        = models.Barra        || model('Barra', barraSchema);
export const BebidaModel       = models.Bebida       || model('Bebida', bebidaSchema);
export const VentaModel        = models.Venta        || model('Venta', ventaSchema);
export const DetalleVentaModel = models.DetalleVenta || model('DetalleVenta', detalleVentaSchema);
