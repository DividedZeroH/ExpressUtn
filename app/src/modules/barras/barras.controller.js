// src/modules/barras/barras.controller.js
//
// Controller delgado: valida HTTP, delega al service, devuelve respuesta JSON.
// Toda la lógica de negocio/datos vive en barras.service.js.

import asyncHandler from '../../shared/asyncHandler.js';
import * as barrasService from './barras.service.js';

// GET /api/barras
export const getAll = asyncHandler(async (req, res) => {
  const data = await barrasService.listarBarras();
  res.json(data);
});

// GET /api/barras/:id
export const getById = asyncHandler(async (req, res) => {
  const barra = await barrasService.obtenerBarra(req.params.id);
  if (!barra) {
    return res.status(404).json({ error: { message: 'Barra no encontrada.' } });
  }
  res.json(barra);
});

// POST /api/barras
export const create = asyncHandler(async (req, res) => {
  const barra = await barrasService.crearBarra(req.body);
  res.status(201).json(barra);
});

// PUT /api/barras/:id
export const update = asyncHandler(async (req, res) => {
  const barra = await barrasService.actualizarBarra(req.params.id, req.body);
  if (!barra) {
    return res.status(404).json({ error: { message: 'Barra no encontrada.' } });
  }
  res.json(barra);
});

// DELETE /api/barras/:id
export const remove = asyncHandler(async (req, res) => {
  const eliminada = await barrasService.eliminarBarra(req.params.id);
  if (!eliminada) {
    return res.status(404).json({ error: { message: 'Barra no encontrada.' } });
  }
  res.status(204).send();
});
