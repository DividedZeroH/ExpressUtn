// src/modules/detalle-ventas/detalle-ventas.service.js
//
// Lógica de negocio para detalle_ventas. Interactúa con la capa de datos
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

/**
 * Valida que un valor sea un entero (o convertible a entero) mayor o igual a min.
 */
function parseEntero(valor, campo, min = null) {
  if (valor === undefined || valor === null || valor === '') {
    throw validationError(`El campo "${campo}" es requerido.`);
  }
  const num = Number(valor);
  if (!Number.isInteger(num)) {
    throw validationError(`El campo "${campo}" debe ser un número entero.`);
  }
  if (min !== null && num < min) {
    throw validationError(`El campo "${campo}" debe ser mayor o igual a ${min}.`);
  }
  return num;
}

/**
 * Valida las FKs referenciadas: venta_id, bebida_id, barra_id.
 * Lanza error 400 si alguna entidad referenciada no existe.
 */
async function validarFKs(repos, { venta_id, bebida_id, barra_id }) {
  if (venta_id !== undefined) {
    const venta = await repos.ventas.findById(venta_id);
    if (!venta) throw validationError(`La venta ${venta_id} no existe.`);
  }
  if (bebida_id !== undefined) {
    const bebida = await repos.bebidas.findById(bebida_id);
    if (!bebida) throw validationError(`La bebida ${bebida_id} no existe.`);
  }
  if (barra_id !== undefined) {
    const barra = await repos.barras.findById(barra_id);
    if (!barra) throw validationError(`La barra ${barra_id} no existe.`);
  }
}

// ── Listar todos los detalles de venta ───────────────────────────────────────

export async function listarDetalleVentas() {
  const repos = await getRepositories();
  return repos.detalleVentas.findAll({});
}

// ── Obtener un detalle de venta por id ───────────────────────────────────────

export async function obtenerDetalleVenta(id) {
  const repos = await getRepositories();
  return repos.detalleVentas.findById(id); // null si no existe → controller envía 404
}

// ── Crear un detalle de venta ─────────────────────────────────────────────────

export async function crearDetalleVenta(data) {
  const { venta_id, bebida_id, barra_id } = data;

  // Validación de campos requeridos (enteros)
  const ventaId   = parseEntero(venta_id,  'venta_id');
  const bebidaId  = parseEntero(bebida_id, 'bebida_id');
  const barraId   = parseEntero(barra_id,  'barra_id');

  // cantidad: requerido, entero ≥ 1 (default 1 si no se envía)
  const cantidadRaw = data.cantidad !== undefined ? data.cantidad : 1;
  const cantidad = parseEntero(cantidadRaw, 'cantidad', 1);

  // subtotal: numérico ≥ 0 (default 0 si no se envía)
  const subtotalRaw = data.subtotal !== undefined ? data.subtotal : 0;
  const subtotalNum = Number(subtotalRaw);
  if (isNaN(subtotalNum) || subtotalNum < 0) {
    throw validationError('El campo "subtotal" debe ser un número mayor o igual a 0.');
  }

  // Validar que las FKs existan
  const repos = await getRepositories();
  await validarFKs(repos, { venta_id: ventaId, bebida_id: bebidaId, barra_id: barraId });

  return repos.detalleVentas.create({
    venta_id:  ventaId,
    bebida_id: bebidaId,
    barra_id:  barraId,
    cantidad,
    subtotal:  subtotalNum,
  });
}

// ── Actualizar un detalle de venta ────────────────────────────────────────────

export async function actualizarDetalleVenta(id, data) {
  let payload = { ...data };

  // Validaciones opcionales: si se envían campos, deben ser válidos
  if (payload.venta_id !== undefined) {
    payload.venta_id = parseEntero(payload.venta_id, 'venta_id');
  }
  if (payload.bebida_id !== undefined) {
    payload.bebida_id = parseEntero(payload.bebida_id, 'bebida_id');
  }
  if (payload.barra_id !== undefined) {
    payload.barra_id = parseEntero(payload.barra_id, 'barra_id');
  }
  if (payload.cantidad !== undefined) {
    payload.cantidad = parseEntero(payload.cantidad, 'cantidad', 1);
  }
  if (payload.subtotal !== undefined) {
    const subtotalNum = Number(payload.subtotal);
    if (isNaN(subtotalNum) || subtotalNum < 0) {
      throw validationError('El campo "subtotal" debe ser un número mayor o igual a 0.');
    }
    payload.subtotal = subtotalNum;
  }

  // Validar que las FKs existan (solo las que vienen en el payload)
  const repos = await getRepositories();
  await validarFKs(repos, {
    venta_id:  payload.venta_id,
    bebida_id: payload.bebida_id,
    barra_id:  payload.barra_id,
  });

  return repos.detalleVentas.update(id, payload); // null si no existe → controller envía 404
}

// ── Eliminar un detalle de venta ──────────────────────────────────────────────

export async function eliminarDetalleVenta(id) {
  const repos = await getRepositories();
  return repos.detalleVentas.delete(id); // false si no existía
}
