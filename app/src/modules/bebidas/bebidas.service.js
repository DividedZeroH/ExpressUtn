// src/modules/bebidas/bebidas.service.js
//
// Lógica de negocio para bebidas. Interactúa con la capa de datos
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

// ── Listar todas las bebidas ──────────────────────────────────────────────────

export async function listarBebidas() {
  const { bebidas } = await getRepositories();
  return bebidas.findAll({});
}

// ── Obtener una bebida por id ─────────────────────────────────────────────────

export async function obtenerBebida(id) {
  const { bebidas } = await getRepositories();
  return bebidas.findById(id); // null si no existe → controller envía 404
}

// ── Crear una bebida ──────────────────────────────────────────────────────────

export async function crearBebida(data) {
  const { nombre, precio, descripcion } = data;

  // Validación de campos requeridos
  if (!nombre || nombre.toString().trim() === '') {
    throw validationError('El campo "nombre" es requerido.');
  }
  if (precio === undefined || precio === null || precio === '') {
    throw validationError('El campo "precio" es requerido.');
  }
  const precioNum = Number(precio);
  if (isNaN(precioNum) || precioNum < 0) {
    throw validationError('El campo "precio" debe ser un número mayor o igual a 0.');
  }

  const { bebidas } = await getRepositories();
  return bebidas.create({ nombre: nombre.toString().trim(), precio: precioNum, descripcion });
}

// ── Actualizar una bebida ─────────────────────────────────────────────────────

export async function actualizarBebida(id, data) {
  // Validaciones opcionales: si se envían campos, deben ser válidos
  if (data.nombre !== undefined && data.nombre.toString().trim() === '') {
    throw validationError('El campo "nombre" no puede estar vacío.');
  }
  if (data.precio !== undefined) {
    const precioNum = Number(data.precio);
    if (isNaN(precioNum) || precioNum < 0) {
      throw validationError('El campo "precio" debe ser un número mayor o igual a 0.');
    }
    data = { ...data, precio: precioNum };
  }

  const { bebidas } = await getRepositories();
  return bebidas.update(id, data); // null si no existe → controller envía 404
}

// ── Eliminar una bebida ───────────────────────────────────────────────────────

export async function eliminarBebida(id) {
  const { bebidas } = await getRepositories();
  return bebidas.delete(id); // false si no existía; FK violation → lanza error
}
