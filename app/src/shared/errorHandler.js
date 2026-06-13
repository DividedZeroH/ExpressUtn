// src/shared/errorHandler.js
//
// Middleware de manejo de errores global (4 argumentos → Express lo reconoce como
// error handler). Debe registrarse DESPUÉS de todas las rutas en app.js.
//
// Mapeo de códigos de error conocidos:
//   23503 → FK violation → 409 Conflict
//   23505 → unique violation → 409 Conflict
//   400   → error de validación lanzado manualmente

/**
 * Determina si el error es una violación de clave foránea de Postgres.
 */
function esForeignKeyViolation(err) {
  const code =
    err.original?.code || err.parent?.code || err.cause?.code || '';
  if (code === '23503') return true;

  const msg = (err.message || '').toLowerCase();
  if (msg.includes('foreign key')) return true;

  return false;
}

/**
 * Determina si el error es una violación de unicidad de Postgres.
 */
function esUniqueViolation(err) {
  const code =
    err.original?.code || err.parent?.code || err.cause?.code || '';
  return code === '23505';
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[errorHandler]', err.message);

  // Error de validación manual (lanzado con status ya asignado)
  if (err.status === 400 || err.statusCode === 400) {
    return res.status(400).json({ error: { message: err.message } });
  }

  // Violación de clave foránea
  if (esForeignKeyViolation(err)) {
    return res.status(409).json({
      error: {
        message:
          'No se puede completar la operación: el registro está referenciado por otro registro (violación de clave foránea).',
        code: 'FK_VIOLATION',
      },
    });
  }

  // Violación de unicidad
  if (esUniqueViolation(err)) {
    return res.status(409).json({
      error: {
        message: 'Ya existe un registro con ese valor único.',
        code: 'UNIQUE_VIOLATION',
      },
    });
  }

  // Error genérico del servidor
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: {
      message: err.message || 'Error interno del servidor.',
    },
  });
};

export default errorHandler;
