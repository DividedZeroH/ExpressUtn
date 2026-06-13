// src/repositories/drizzle/index.js
//
// Conecta cada entidad del bar con su repositorio Drizzle.
// Reutiliza la misma base PostgreSQL que Sequelize.

import DrizzleRepository from './drizzle.repository.js';
import { getDrizzle } from './connection.js';
import { barras, bebidas, ventas, detalle_ventas } from './schema.js';

export default function createDrizzleRepositories() {
  const db = getDrizzle();
  return {
    driver: 'drizzle',
    barras:        new DrizzleRepository(db, barras),
    bebidas:       new DrizzleRepository(db, bebidas),
    ventas:        new DrizzleRepository(db, ventas),
    detalleVentas: new DrizzleRepository(db, detalle_ventas),
  };
}
