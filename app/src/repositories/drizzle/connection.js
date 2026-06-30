// src/repositories/drizzle/connection.js
//
// Conexión a PostgreSQL vía Drizzle ORM (sobre node-postgres / pg).
// Reutiliza las mismas variables POSTGRES_* que Sequelize: Drizzle apunta a la
// misma base. El Pool conecta de forma perezosa (recién en la primera query).
// Solo se ejecuta si DB_DRIVER=drizzle.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;

let db = null;
let pool = null;

export function getDrizzle() {
  if (db) return db;

  pool = new Pool({
    host:     process.env.POSTGRES_HOST || 'localhost',
    port:     parseInt(process.env.POSTGRES_PORT || '5432'),
    user:     process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgres',
  });

  db = drizzle(pool);
  console.log('Drizzle inicializado sobre PostgreSQL');
  return db;
}

export function getDrizzlePool() {
  return pool;
}

export default getDrizzle;
