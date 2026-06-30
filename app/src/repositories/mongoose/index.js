// src/repositories/mongoose/index.js
//
// Conecta cada entidad del bar con su repositorio Mongoose.
// Abre la conexión a MongoDB antes de devolver los repositorios.

import MongooseRepository from './mongoose.repository.js';
import { connectMongoose } from './connection.js';
import {
  BarraModel,
  BebidaModel,
  VentaModel,
  DetalleVentaModel,
} from './schemas.js';

export default async function createMongooseRepositories() {
  await connectMongoose();
  return {
    driver: 'mongoose',
    barras:        new MongooseRepository(BarraModel),
    bebidas:       new MongooseRepository(BebidaModel),
    ventas:        new MongooseRepository(VentaModel),
    detalleVentas: new MongooseRepository(DetalleVentaModel),
  };
}
