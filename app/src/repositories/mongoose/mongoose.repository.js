// src/repositories/mongoose/mongoose.repository.js
//
// Implementación genérica del contrato BaseRepository sobre un modelo Mongoose.
// Misma API pública que SequelizeRepository: el consumidor no distingue cuál usa.
//
// IMPORTANTE: opera sobre el campo numérico `id` (no sobre el ObjectId `_id`),
// para mantener la misma semántica de identificadores que Sequelize. Así
// `findById(1)`, las rutas `/api/recurso/1` y las FK enteras siguen funcionando.

import BaseRepository from '../base.repository.js';
import { nextId } from './counter.js';

export default class MongooseRepository extends BaseRepository {
  constructor(model) {
    super();
    this.model = model;
    // Nombre de la colección → clave del contador autoincremental.
    this.coleccion = model.collection.collectionName;
  }

  /** Normaliza un id externo (string/number) al entero usado en Mongo, o null si no es válido. */
  #idNum(id) {
    const n = Number(id);
    return Number.isInteger(n) ? n : null;
  }

  async findAll({ where = {}, order, limit, offset } = {}) {
    let query = this.model.find(where);
    if (order)  query = query.sort(order);
    if (offset) query = query.skip(offset);
    if (limit)  query = query.limit(limit);
    return query.exec();
  }

  async findById(id) {
    const n = this.#idNum(id);
    if (n === null) return null;
    return this.model.findOne({ id: n }).exec();
  }

  async findOne(where = {}) {
    return this.model.findOne(where).exec();
  }

  async create(data) {
    // Asigna id autoincremental si no viene explícito (paridad con el SERIAL de SQL).
    const id = data.id != null ? data.id : await nextId(this.coleccion);
    return this.model.create({ ...data, id });
  }

  async update(id, data) {
    const n = this.#idNum(id);
    if (n === null) return null;
    // No permitimos cambiar el id por el cuerpo del request.
    const { id: _omit, ...rest } = data;
    return this.model.findOneAndUpdate({ id: n }, rest, { new: true }).exec();
  }

  async delete(id) {
    const n = this.#idNum(id);
    if (n === null) return false;
    const deleted = await this.model.findOneAndDelete({ id: n }).exec();
    return deleted != null;
  }

  async count(where = {}) {
    return this.model.countDocuments(where).exec();
  }
}
