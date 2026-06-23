// src/repositories/mongoose/counter.js
//
// Autoincremento de ids para Mongo. MongoDB no tiene SERIAL/AUTO_INCREMENT como
// PostgreSQL, así que mantenemos una colección `counters` con un contador por
// colección ({ _id: 'bebidas', seq: 10 }). Cada create() pide el siguiente id.
//
// Esto permite que los documentos tengan un `id` numérico igual que en SQL, y que
// la API REST y las FK (venta_id, bebida_id, barra_id) sigan siendo enteros.

import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String },          // nombre de la colección, ej. 'bebidas'
  seq: { type: Number, default: 0 },
}, { versionKey: false });

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/** Devuelve el siguiente id para `name`, incrementando el contador de forma atómica. */
export async function nextId(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).exec();
  return doc.seq;
}

/** Fija el contador de `name` en `value` (se usa tras sembrar datos con ids fijos). */
export async function setCounter(name, value) {
  await Counter.findByIdAndUpdate(
    name,
    { $set: { seq: value } },
    { upsert: true },
  ).exec();
}

export default Counter;
