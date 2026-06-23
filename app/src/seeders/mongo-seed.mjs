// src/seeders/mongo-seed.mjs
//
// Seeder para MongoDB (driver mongoose). Equivale a los seeders de Sequelize
// 001-initial-data.js + 002-bebidas-stock.js, pero para Mongo: como NoSQL no usa
// sequelize-cli ni migraciones, sembramos con un script Node directo.
//
// Extensión .mjs: el directorio src/seeders/ está marcado como CommonJS por su
// package.json (para los seeders de sequelize-cli); .mjs fuerza ESM en este script.
//
// Uso:
//   node src/seeders/mongo-seed.mjs
//   (o vía npm: npm run seed:mongo)
//
// Reinicia las colecciones y carga los mismos datos que la base SQL, con los
// mismos ids enteros, y deja los contadores autoincrementales en el máximo id.

import 'dotenv/config';
import { connectMongoose } from '../repositories/mongoose/connection.js';
import mongoose from 'mongoose';
import {
  BarraModel,
  BebidaModel,
  VentaModel,
  DetalleVentaModel,
} from '../repositories/mongoose/schemas.js';
import { setCounter } from '../repositories/mongoose/counter.js';

const barras = [
  { id: 1, numero_barra: 1, sector: 'NORTE' },
  { id: 2, numero_barra: 2, sector: 'SUR'   },
  { id: 3, numero_barra: 3, sector: 'ESTE'  },
  { id: 4, numero_barra: 4, sector: 'OESTE' },
];

const bebidas = [
  { id: 1,  nombre: 'COCA COLA',       precio: 1500, descripcion: 'Gaseosa cola 500ml',       stock: 50  },
  { id: 2,  nombre: 'SPRITE',          precio: 1500, descripcion: 'Gaseosa lima limon 500ml', stock: 50  },
  { id: 3,  nombre: 'AGUA MINERAL',    precio: 1000, descripcion: 'Agua sin gas 500ml',       stock: 100 },
  { id: 4,  nombre: 'CERVEZA RUBIA',   precio: 2500, descripcion: 'Cerveza lager 500ml',      stock: 75  },
  { id: 5,  nombre: 'CERVEZA NEGRA',   precio: 2800, descripcion: 'Cerveza stout 500ml',      stock: 60  },
  { id: 6,  nombre: 'FERNET',          precio: 3000, descripcion: 'Fernet con cola',          stock: 40  },
  { id: 7,  nombre: 'APEROL SPRITZ',   precio: 3500, descripcion: 'Aperol con espumante',     stock: 35  },
  { id: 8,  nombre: 'VINO TINTO',      precio: 2000, descripcion: 'Copa de vino tinto',       stock: 80  },
  { id: 9,  nombre: 'VINO BLANCO',     precio: 2000, descripcion: 'Copa de vino blanco',      stock: 80  },
  { id: 10, nombre: 'JUGO DE NARANJA', precio: 1200, descripcion: 'Jugo natural exprimido',   stock: 100 },
];

const ventas = [
  { id: 1, numero_venta: 1001, fecha: '2024-03-01', hora: '20:00:00', total: 7000 },
  { id: 2, numero_venta: 1002, fecha: '2024-03-01', hora: '20:30:00', total: 5500 },
  { id: 3, numero_venta: 1003, fecha: '2024-03-02', hora: '21:00:00', total: 9500 },
];

const detalleVentas = [
  { id: 1, venta_id: 1, bebida_id: 4, barra_id: 1, cantidad: 2, subtotal: 5000 },
  { id: 2, venta_id: 1, bebida_id: 1, barra_id: 1, cantidad: 1, subtotal: 1500 },
  { id: 3, venta_id: 1, bebida_id: 3, barra_id: 1, cantidad: 1, subtotal:  500 },
  { id: 4, venta_id: 2, bebida_id: 6, barra_id: 2, cantidad: 1, subtotal: 3000 },
  { id: 5, venta_id: 2, bebida_id: 1, barra_id: 2, cantidad: 1, subtotal: 1500 },
  { id: 6, venta_id: 2, bebida_id: 2, barra_id: 2, cantidad: 1, subtotal: 1000 },
  { id: 7, venta_id: 3, bebida_id: 7, barra_id: 3, cantidad: 2, subtotal: 7000 },
  { id: 8, venta_id: 3, bebida_id: 9, barra_id: 3, cantidad: 1, subtotal: 2500 },
];

async function seed() {
  await connectMongoose();
  console.log('Limpiando colecciones...');
  await Promise.all([
    BarraModel.deleteMany({}),
    BebidaModel.deleteMany({}),
    VentaModel.deleteMany({}),
    DetalleVentaModel.deleteMany({}),
  ]);

  console.log('Insertando datos...');
  // insertMany evita los setters (toUpperCase) del schema; los datos ya vienen normalizados.
  await BarraModel.insertMany(barras);
  await BebidaModel.insertMany(bebidas);
  await VentaModel.insertMany(ventas);
  await DetalleVentaModel.insertMany(detalleVentas);

  console.log('Ajustando contadores autoincrementales...');
  await setCounter('barras',         Math.max(...barras.map((b) => b.id)));
  await setCounter('bebidas',        Math.max(...bebidas.map((b) => b.id)));
  await setCounter('ventas',         Math.max(...ventas.map((v) => v.id)));
  await setCounter('detalle_ventas', Math.max(...detalleVentas.map((d) => d.id)));

  console.log('Seed de MongoDB completado.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error al sembrar MongoDB:', err);
  process.exit(1);
});
