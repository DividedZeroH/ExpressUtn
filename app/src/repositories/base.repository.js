// src/repositories/base.repository.js
//
// Contrato común que toda implementación de repositorio debe cumplir.
// El código que consume datos (servicios, rutas, dashboard) depende de ESTA
// interfaz, NO del ORM concreto. Cambiar de Sequelize a Mongoose se reduce a
// elegir otra implementación de este contrato: el resto del código no cambia.

export default class BaseRepository {
  /** Devuelve todos los registros (opcionalmente filtrados/ordenados/paginados). */
  async findAll(/* { where, order, limit, offset } */) {
    throw new Error('findAll() no implementado');
  }

  /** Busca un registro por su identificador. Devuelve null si no existe. */
  async findById(/* id */) {
    throw new Error('findById() no implementado');
  }

  /** Devuelve el primer registro que cumpla el filtro, o null. */
  async findOne(/* where */) {
    throw new Error('findOne() no implementado');
  }

  /** Crea un registro y devuelve el resultado persistido. */
  async create(/* data */) {
    throw new Error('create() no implementado');
  }

  /** Actualiza el registro `id` con `data`. Devuelve el registro o null. */
  async update(/* id, data */) {
    throw new Error('update() no implementado');
  }

  /** Elimina el registro `id`. Devuelve true si borró algo. */
  async delete(/* id */) {
    throw new Error('delete() no implementado');
  }

  /** Cuenta registros (opcionalmente filtrados). */
  async count(/* where */) {
    throw new Error('count() no implementado');
  }
}
