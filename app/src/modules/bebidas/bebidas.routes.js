// src/modules/bebidas/bebidas.routes.js
//
// Define las rutas REST del recurso bebidas y las conecta con el controller.

import { Router } from 'express';
import * as bebidasController from './bebidas.controller.js';

const router = Router();

router.get('/',     bebidasController.getAll);
router.get('/:id',  bebidasController.getById);
router.post('/',    bebidasController.create);
router.put('/:id',  bebidasController.update);
router.delete('/:id', bebidasController.remove);

export default router;
