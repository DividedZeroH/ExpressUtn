// src/modules/ventas/ventas.service.js
//
// Lógica de negocio para ventas. Interactúa con la capa de datos
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

// ── Listar todas las ventas ───────────────────────────────────────────────────

export async function listarVentas() {
  const { ventas } = await getRepositories();
  return ventas.findAll({});
}

// ── Obtener una venta por id ──────────────────────────────────────────────────

export async function obtenerVenta(id) {
  const { ventas } = await getRepositories();
  return ventas.findById(id); // null si no existe → controller envía 404
}

// ── Crear una venta ───────────────────────────────────────────────────────────

export async function crearVenta(data) {
  let { numero_venta, fecha, hora, total } = data;

  // Validación: numero_venta requerido y entero
  if (numero_venta === undefined || numero_venta === null || numero_venta === '') {
    throw validationError('El campo "numero_venta" es requerido.');
  }
  const numeroNum = Number(numero_venta);
  if (!Number.isInteger(numeroNum)) {
    throw validationError('El campo "numero_venta" debe ser un número entero.');
  }

  // Validación: fecha requerida con formato YYYY-MM-DD
  if (!fecha || fecha.toString().trim() === '') {
    throw validationError('El campo "fecha" es requerido.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha.toString().trim())) {
    throw validationError('El campo "fecha" debe tener el formato YYYY-MM-DD.');
  }

  // Validación: hora requerida con formato HH:mm o HH:mm:ss
  if (!hora || hora.toString().trim() === '') {
    throw validationError('El campo "hora" es requerido.');
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(hora.toString().trim())) {
    throw validationError('El campo "hora" debe tener el formato HH:mm o HH:mm:ss.');
  }

  // Validación: total numérico >= 0 (default 0 si no viene)
  if (total === undefined || total === null || total === '') {
    total = 0;
  }
  const totalNum = Number(total);
  if (isNaN(totalNum) || totalNum < 0) {
    throw validationError('El campo "total" debe ser un número mayor o igual a 0.');
  }

  const { ventas } = await getRepositories();
  return ventas.create({
    numero_venta: numeroNum,
    fecha: fecha.toString().trim(),
    hora: hora.toString().trim(),
    total: totalNum,
  });
}

// ── Actualizar una venta ──────────────────────────────────────────────────────

export async function actualizarVenta(id, data) {
  // Validaciones opcionales: si se envían campos, deben ser válidos
  if (data.numero_venta !== undefined) {
    const numeroNum = Number(data.numero_venta);
    if (!Number.isInteger(numeroNum)) {
      throw validationError('El campo "numero_venta" debe ser un número entero.');
    }
    data = { ...data, numero_venta: numeroNum };
  }

  if (data.fecha !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha.toString().trim())) {
      throw validationError('El campo "fecha" debe tener el formato YYYY-MM-DD.');
    }
    data = { ...data, fecha: data.fecha.toString().trim() };
  }

  if (data.hora !== undefined) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(data.hora.toString().trim())) {
      throw validationError('El campo "hora" debe tener el formato HH:mm o HH:mm:ss.');
    }
    data = { ...data, hora: data.hora.toString().trim() };
  }

  if (data.total !== undefined) {
    const totalNum = Number(data.total);
    if (isNaN(totalNum) || totalNum < 0) {
      throw validationError('El campo "total" debe ser un número mayor o igual a 0.');
    }
    data = { ...data, total: totalNum };
  }

  const { ventas } = await getRepositories();
  return ventas.update(id, data); // null si no existe → controller envía 404
}

// ── Eliminar una venta ────────────────────────────────────────────────────────

export async function eliminarVenta(id) {
  const { ventas } = await getRepositories();
  return ventas.delete(id); // false si no existía; FK violation → lanza error
}
