// src/repositories/sequelize/sequelize.repository.js
//
// Implementación genérica del contrato BaseRepository sobre un modelo Sequelize.
// Una sola clase sirve para las 4 entidades: se le pasa el modelo en el constructor.

import BaseRepository from '../base.repository.js';

export default class SequelizeRepository extends BaseRepository {
  constructor(model) {
    super();
    this.model = model;
  }

  async findAll({ where = {}, order, limit, offset } = {}) {
    return this.model.findAll({ where, order, limit, offset });
  }

  async findById(id) {
    return this.model.findByPk(id);
  }

  async findOne(where = {}) {
    return this.model.findOne({ where });
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    const row = await this.model.findByPk(id);
    if (!row) return null;
    return row.update(data);
  }

  async delete(id) {
    const count = await this.model.destroy({ where: { id } });
    return count > 0;
  }

  async count(where = {}) {
    return this.model.count({ where });
  }
}
