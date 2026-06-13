// src/modules/index.js
//
// Registrador central de módulos de la API REST.
// Importa el router de cada entidad y los monta bajo su prefijo de recurso.
// Este router se monta en app.js bajo /api.

import { Router } from 'express';
import bebidasRouter      from './bebidas/bebidas.routes.js';
import barrasRouter       from './barras/barras.routes.js';
import ventasRouter       from './ventas/ventas.routes.js';
import detalleVentasRouter from './detalle-ventas/detalle-ventas.routes.js';

const apiRouter = Router();

// TODO: auth en /api

apiRouter.use('/bebidas',        bebidasRouter);
apiRouter.use('/barras',         barrasRouter);
apiRouter.use('/ventas',         ventasRouter);
apiRouter.use('/detalle-ventas', detalleVentasRouter);

export default apiRouter;
