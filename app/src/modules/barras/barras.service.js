// src/modules/barras/barras.service.js
//
// Lógica de negocio para barras. Interactúa con la capa de datos
// exclusivamente a través de getRepositories(). No importa Sequelize directo.

import { getRepositories } from '../../repositories/index.js';

/**
 * Crea un error de validación con status 400.
 */
function validationError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// ── Listar todas las barras ───────────────────────────────────────────────────

export async function listarBarras() {
  const { barras } = await getRepositories();
  return barras.findAll({});
}

// ── Obtener una barra por id ──────────────────────────────────────────────────

export async function obtenerBarra(id) {
  const { barras } = await getRepositories();
  return barras.findById(id); // null si no existe → controller envía 404
}

// ── Crear una barra ───────────────────────────────────────────────────────────

export async function crearBarra(data) {
  const { numero_barra, sector } = data;

  // Validación de campos requeridos
  if (numero_barra === undefined || numero_barra === null || numero_barra === '') {
    throw validationError('El campo "numero_barra" es requerido.');
  }
  const numeroInt = Number(numero_barra);
  if (!Number.isInteger(numeroInt)) {
    throw validationError('El campo "numero_barra" debe ser un entero.');
  }

  if (!sector || sector.toString().trim() === '') {
    throw validationError('El campo "sector" es requerido.');
  }

  const { barras } = await getRepositories();
  return barras.create({ numero_barra: numeroInt, sector: sector.toString().trim() });
}

// ── Actualizar una barra ──────────────────────────────────────────────────────

export async function actualizarBarra(id, data) {
  // Validaciones opcionales: si se envían campos, deben ser válidos
  if (data.numero_barra !== undefined) {
    const numeroInt = Number(data.numero_barra);
    if (!Number.isInteger(numeroInt)) {
      throw validationError('El campo "numero_barra" debe ser un entero.');
    }
    data = { ...data, numero_barra: numeroInt };
  }
  if (data.sector !== undefined && data.sector.toString().trim() === '') {
    throw validationError('El campo "sector" no puede estar vacío.');
  }

  const { barras } = await getRepositories();
  return barras.update(id, data); // null si no existe → controller envía 404
}

// ── Eliminar una barra ────────────────────────────────────────────────────────

export async function eliminarBarra(id) {
  const { barras } = await getRepositories();
  return barras.delete(id); // false si no existía; FK violation → lanza error
}
