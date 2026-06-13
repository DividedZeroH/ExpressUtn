// src/modules/barras/barras.routes.js
//
// Define las rutas REST del recurso barras y las conecta con el controller.

import { Router } from 'express';
import * as barrasController from './barras.controller.js';

const router = Router();

router.get('/',       barrasController.getAll);
router.get('/:id',    barrasController.getById);
router.post('/',      barrasController.create);
router.put('/:id',    barrasController.update);
router.delete('/:id', barrasController.remove);

export default router;
