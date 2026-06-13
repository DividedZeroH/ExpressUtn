// src/repositories/sequelize/index.js
//
// Conecta cada entidad del bar con su repositorio Sequelize.
// Reutiliza los modelos Sequelize ya existentes en src/models/.

import SequelizeRepository from './sequelize.repository.js';
import { Barra, Bebida, Venta, DetalleVenta } from '../../models/index.js';

export default function createSequelizeRepositories() {
  return {
    driver: 'sequelize',
    barras:        new SequelizeRepository(Barra),
    bebidas:       new SequelizeRepository(Bebida),
    ventas:        new SequelizeRepository(Venta),
    detalleVentas: new SequelizeRepository(DetalleVenta),
  };
}
