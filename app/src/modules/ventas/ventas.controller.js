// src/modules/ventas/ventas.controller.js
//
// Controller delgado: valida HTTP, delega al service, devuelve respuesta JSON.
// Toda la lógica de negocio/datos vive en ventas.service.js.

import asyncHandler from '../../shared/asyncHandler.js';
import * as ventasService from './ventas.service.js';

// GET /api/ventas
export const getAll = asyncHandler(async (req, res) => {
  const data = await ventasService.listarVentas();
  res.json(data);
});

// GET /api/ventas/:id
export const getById = asyncHandler(async (req, res) => {
  const venta = await ventasService.obtenerVenta(req.params.id);
  if (!venta) {
    return res.status(404).json({ error: { message: 'Venta no encontrada.' } });
  }
  res.json(venta);
});

// POST /api/ventas
export const create = asyncHandler(async (req, res) => {
  const venta = await ventasService.crearVenta(req.body);
  res.status(201).json(venta);
});

// PUT /api/ventas/:id
export const update = asyncHandler(async (req, res) => {
  const venta = await ventasService.actualizarVenta(req.params.id, req.body);
  if (!venta) {
    return res.status(404).json({ error: { message: 'Venta no encontrada.' } });
  }
  res.json(venta);
});

// DELETE /api/ventas/:id
export const remove = asyncHandler(async (req, res) => {
  const eliminada = await ventasService.eliminarVenta(req.params.id);
  if (!eliminada) {
    return res.status(404).json({ error: { message: 'Venta no encontrada.' } });
  }
  res.status(204).send();
});
