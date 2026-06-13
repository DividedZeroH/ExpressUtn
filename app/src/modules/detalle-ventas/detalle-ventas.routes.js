// src/modules/detalle-ventas/detalle-ventas.routes.js
//
// Define las rutas REST del recurso detalle-ventas y las conecta con el controller.

import { Router } from 'express';
import * as detalleVentasController from './detalle-ventas.controller.js';

const router = Router();

router.get('/',       detalleVentasController.getAll);
router.get('/:id',    detalleVentasController.getById);
router.post('/',      detalleVentasController.create);
router.put('/:id',    detalleVentasController.update);
router.delete('/:id', detalleVentasController.remove);

export default router;
