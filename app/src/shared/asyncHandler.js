// src/shared/asyncHandler.js
//
// Envuelve un handler async de Express para capturar errores y pasarlos a next().
// Evita el try/catch repetitivo en cada controller.

/**
 * @param {Function} fn  Handler async (req, res, next) => Promise
 * @returns {Function}   Handler estándar de Express
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
