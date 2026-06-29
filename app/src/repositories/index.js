// src/repositories/index.js
//
// Punto único de entrada a la capa de datos. Elegí el ORM con la variable de
// entorno DB_DRIVER:
//
//   DB_DRIVER=sequelize   (por defecto) → PostgreSQL vía Sequelize
//   DB_DRIVER=drizzle                   → PostgreSQL vía Drizzle ORM
//   DB_DRIVER=mongoose                  → MongoDB vía Mongoose
//
// El resto de la app pide repositorios con getRepositories() y NO sabe (ni le
// importa) qué ORM hay debajo. Para cambiar de ORM no se toca el código que
// consume datos: solo esta fábrica y la variable de entorno.
//
// Las implementaciones Drizzle y Mongoose se importan de forma dinámica: si
// DB_DRIVER no las selecciona, sus paquetes ni se cargan (no hace falta tenerlos
// instalados para correr con Sequelize).

import createSequelizeRepositories from './sequelize/index.js';

let repositories = null;

export async function getRepositories() {
  if (repositories) return repositories;

  const driver = (process.env.DB_DRIVER || 'sequelize').toLowerCase();

  repositories = createSequelizeRepositories();

  console.log(`Repositorios inicializados con driver: ${repositories.driver}`);
  return repositories;
}

/** Reinicia la fábrica (útil en tests para forzar otra inicialización). */
export function resetRepositories() {
  repositories = null;
}
