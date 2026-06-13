// src/modules/ventas/ventas.routes.js
//
// Define las rutas REST del recurso ventas y las conecta con el controller.

import { Router } from 'express';
import * as ventasController from './ventas.controller.js';

const router = Router();

router.get('/',       ventasController.getAll);
router.get('/:id',    ventasController.getById);
router.post('/',      ventasController.create);
router.put('/:id',    ventasController.update);
router.delete('/:id', ventasController.remove);

export default router;
