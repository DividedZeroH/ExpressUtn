// src/repositories/mongoose/mongoose.repository.js
//
// Implementación genérica del contrato BaseRepository sobre un modelo Mongoose.
// Misma API pública que SequelizeRepository: el consumidor no distingue cuál usa.

import BaseRepository from '../base.repository.js';

export default class MongooseRepository extends BaseRepository {
  constructor(model) {
    super();
    this.model = model;
  }

  async findAll({ where = {}, order, limit, offset } = {}) {
    let query = this.model.find(where);
    if (order)  query = query.sort(order);
    if (offset) query = query.skip(offset);
    if (limit)  query = query.limit(limit);
    return query.exec();
  }

  async findById(id) {
    return this.model.findById(id).exec();
  }

  async findOne(where = {}) {
    return this.model.findOne(where).exec();
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id) {
    const deleted = await this.model.findByIdAndDelete(id).exec();
    return deleted != null;
  }

  async count(where = {}) {
    return this.model.countDocuments(where).exec();
  }
}
