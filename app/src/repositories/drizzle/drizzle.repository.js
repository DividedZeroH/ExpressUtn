// src/repositories/drizzle/drizzle.repository.js
//
// Implementación genérica del contrato BaseRepository sobre Drizzle ORM.
// Recibe la instancia `db` y la `table` (de schema.js) en el constructor.
// Misma API pública que las demás implementaciones: el consumidor no distingue.

import BaseRepository from '../base.repository.js';
import { eq, and, sql } from 'drizzle-orm';

export default class DrizzleRepository extends BaseRepository {
  constructor(db, table) {
    super();
    this.db = db;
    this.table = table;
  }

  // Convierte un filtro { columna: valor } en una condición AND de igualdades.
  #buildWhere(where = {}) {
    const conds = Object.entries(where).map(([k, v]) => eq(this.table[k], v));
    return conds.length ? and(...conds) : undefined;
  }

  async findAll({ where = {}, limit, offset } = {}) {
    let query = this.db.select().from(this.table);
    const cond = this.#buildWhere(where);
    if (cond)   query = query.where(cond);
    if (limit)  query = query.limit(limit);
    if (offset) query = query.offset(offset);
    return query;
  }

  async findById(id) {
    const rows = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findOne(where = {}) {
    let query = this.db.select().from(this.table);
    const cond = this.#buildWhere(where);
    if (cond) query = query.where(cond);
    const rows = await query.limit(1);
    return rows[0] ?? null;
  }

  async create(data) {
    const rows = await this.db.insert(this.table).values(data).returning();
    return rows[0];
  }

  async update(id, data) {
    const rows = await this.db.update(this.table).set(data).where(eq(this.table.id, id)).returning();
    return rows[0] ?? null;
  }

  async delete(id) {
    const rows = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();
    return rows.length > 0;
  }

  async count(where = {}) {
    let query = this.db.select({ count: sql`count(*)::int` }).from(this.table);
    const cond = this.#buildWhere(where);
    if (cond) query = query.where(cond);
    const rows = await query;
    return rows[0]?.count ?? 0;
  }
}
