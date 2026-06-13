// src/modules/detalle-ventas/detalle-ventas.controller.js
//
// Controller delgado: valida HTTP, delega al service, devuelve respuesta JSON.
// Toda la lógica de negocio/datos vive en detalle-ventas.service.js.

import asyncHandler from '../../shared/asyncHandler.js';
import * as detalleVentasService from './detalle-ventas.service.js';

// GET /api/detalle-ventas
export const getAll = asyncHandler(async (req, res) => {
  const data = await detalleVentasService.listarDetalleVentas();
  res.json(data);
});

// GET /api/detalle-ventas/:id
export const getById = asyncHandler(async (req, res) => {
  const detalle = await detalleVentasService.obtenerDetalleVenta(req.params.id);
  if (!detalle) {
    return res.status(404).json({ error: { message: 'Detalle de venta no encontrado.' } });
  }
  res.json(detalle);
});

// POST /api/detalle-ventas
export const create = asyncHandler(async (req, res) => {
  const detalle = await detalleVentasService.crearDetalleVenta(req.body);
  res.status(201).json(detalle);
});

// PUT /api/detalle-ventas/:id
export const update = asyncHandler(async (req, res) => {
  const detalle = await detalleVentasService.actualizarDetalleVenta(req.params.id, req.body);
  if (!detalle) {
    return res.status(404).json({ error: { message: 'Detalle de venta no encontrado.' } });
  }
  res.json(detalle);
});

// DELETE /api/detalle-ventas/:id
export const remove = asyncHandler(async (req, res) => {
  const eliminado = await detalleVentasService.eliminarDetalleVenta(req.params.id);
  if (!eliminado) {
    return res.status(404).json({ error: { message: 'Detalle de venta no encontrado.' } });
  }
  res.status(204).send();
});
