// src/repositories/drizzle/schema.js
//
// Definición de tablas en Drizzle ORM, equivalente a las migraciones de
// src/migrations/001-initial.js. Mismas tablas y columnas; Drizzle usa
// query-builder tipado en lugar de modelos.
//
// Mapeo de tipos: DECIMAL → numeric, DATEONLY → date, TIME → time.

import { pgTable, serial, integer, varchar, text, numeric, date, time } from 'drizzle-orm/pg-core';

export const barras = pgTable('barras', {
  id:           serial('id').primaryKey(),
  numero_barra: integer('numero_barra').notNull(),
  sector:       varchar('sector', { length: 100 }).notNull(),
});

export const bebidas = pgTable('bebidas', {
  id:          serial('id').primaryKey(),
  nombre:      varchar('nombre', { length: 200 }).notNull(),
  precio:      numeric('precio', { precision: 15, scale: 2 }).notNull().default('0'),
  descripcion: text('descripcion'),
});

export const ventas = pgTable('ventas', {
  id:           serial('id').primaryKey(),
  numero_venta: integer('numero_venta').notNull(),
  fecha:        date('fecha').notNull(),
  hora:         time('hora').notNull(),
  total:        numeric('total', { precision: 15, scale: 2 }).notNull().default('0'),
});

export const detalle_ventas = pgTable('detalle_ventas', {
  id:        serial('id').primaryKey(),
  venta_id:  integer('venta_id').notNull(),
  bebida_id: integer('bebida_id').notNull(),
  barra_id:  integer('barra_id').notNull(),
  cantidad:  integer('cantidad').notNull().default(1),
  subtotal:  numeric('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
});
