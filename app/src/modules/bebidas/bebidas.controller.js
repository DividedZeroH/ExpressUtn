// src/modules/bebidas/bebidas.controller.js
//
// Controller delgado: valida HTTP, delega al service, devuelve respuesta JSON.
// Toda la lógica de negocio/datos vive en bebidas.service.js.

import asyncHandler from '../../shared/asyncHandler.js';
import * as bebidasService from './bebidas.service.js';

// GET /api/bebidas
export const getAll = asyncHandler(async (req, res) => {
  const data = await bebidasService.listarBebidas();
  res.json(data);
});

// GET /api/bebidas/:id
export const getById = asyncHandler(async (req, res) => {
  const bebida = await bebidasService.obtenerBebida(req.params.id);
  if (!bebida) {
    return res.status(404).json({ error: { message: 'Bebida no encontrada.' } });
  }
  res.json(bebida);
});

// POST /api/bebidas
export const create = asyncHandler(async (req, res) => {
  const bebida = await bebidasService.crearBebida(req.body);
  res.status(201).json(bebida);
});

// PUT /api/bebidas/:id
export const update = asyncHandler(async (req, res) => {
  const bebida = await bebidasService.actualizarBebida(req.params.id, req.body);
  if (!bebida) {
    return res.status(404).json({ error: { message: 'Bebida no encontrada.' } });
  }
  res.json(bebida);
});

// DELETE /api/bebidas/:id
export const remove = asyncHandler(async (req, res) => {
  const eliminada = await bebidasService.eliminarBebida(req.params.id);
  if (!eliminada) {
    return res.status(404).json({ error: { message: 'Bebida no encontrada.' } });
  }
  res.status(204).send();
});
