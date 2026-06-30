'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('barras', [
      { id: 1, numero_barra: 1, sector: 'NORTE' },
      { id: 2, numero_barra: 2, sector: 'SUR'   },
      { id: 3, numero_barra: 3, sector: 'ESTE'  },
      { id: 4, numero_barra: 4, sector: 'OESTE' },
    ]);

    await queryInterface.bulkInsert('bebidas', [
      { id: 1,  nombre: 'COCA COLA',       precio: 1500.00, descripcion: 'Gaseosa cola 500ml',       stock: 0 },
      { id: 2,  nombre: 'SPRITE',          precio: 1500.00, descripcion: 'Gaseosa lima limon 500ml', stock: 0 },
      { id: 3,  nombre: 'AGUA MINERAL',    precio: 1000.00, descripcion: 'Agua sin gas 500ml',       stock: 0 },
      { id: 4,  nombre: 'CERVEZA RUBIA',   precio: 2500.00, descripcion: 'Cerveza lager 500ml',      stock: 0 },
      { id: 5,  nombre: 'CERVEZA NEGRA',   precio: 2800.00, descripcion: 'Cerveza stout 500ml',      stock: 0 },
      { id: 6,  nombre: 'FERNET',          precio: 3000.00, descripcion: 'Fernet con cola',          stock: 0 },
      { id: 7,  nombre: 'APEROL SPRITZ',   precio: 3500.00, descripcion: 'Aperol con espumante',     stock: 0 },
      { id: 8,  nombre: 'VINO TINTO',      precio: 2000.00, descripcion: 'Copa de vino tinto',       stock: 0 },
      { id: 9,  nombre: 'VINO BLANCO',     precio: 2000.00, descripcion: 'Copa de vino blanco',      stock: 0 },
      { id: 10, nombre: 'JUGO DE NARANJA', precio: 1200.00, descripcion: 'Jugo natural exprimido',   stock: 0 },
    ]);

    await queryInterface.bulkInsert('ventas', [
      { id: 1, numero_venta: 1001, fecha: '2024-03-01', hora: '20:00:00', total: 7000.00 },
      { id: 2, numero_venta: 1002, fecha: '2024-03-01', hora: '20:30:00', total: 5500.00 },
      { id: 3, numero_venta: 1003, fecha: '2024-03-02', hora: '21:00:00', total: 9500.00 },
    ]);

    await queryInterface.bulkInsert('detalle_ventas', [
      { id: 1, venta_id: 1, bebida_id: 4, barra_id: 1, cantidad: 2, subtotal: 5000.00 },
      { id: 2, venta_id: 1, bebida_id: 1, barra_id: 1, cantidad: 1, subtotal: 1500.00 },
      { id: 3, venta_id: 1, bebida_id: 3, barra_id: 1, cantidad: 1, subtotal:  500.00 },
      { id: 4, venta_id: 2, bebida_id: 6, barra_id: 2, cantidad: 1, subtotal: 3000.00 },
      { id: 5, venta_id: 2, bebida_id: 1, barra_id: 2, cantidad: 1, subtotal: 1500.00 },
      { id: 6, venta_id: 2, bebida_id: 2, barra_id: 2, cantidad: 1, subtotal: 1000.00 },
      { id: 7, venta_id: 3, bebida_id: 7, barra_id: 3, cantidad: 2, subtotal: 7000.00 },
      { id: 8, venta_id: 3, bebida_id: 9, barra_id: 3, cantidad: 1, subtotal: 2500.00 },
    ]);

    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('barras',        'id'), MAX(id)) FROM barras;
      SELECT setval(pg_get_serial_sequence('bebidas',       'id'), MAX(id)) FROM bebidas;
      SELECT setval(pg_get_serial_sequence('ventas',        'id'), MAX(id)) FROM ventas;
      SELECT setval(pg_get_serial_sequence('detalle_ventas','id'), MAX(id)) FROM detalle_ventas;
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_ventas', null, {});
    await queryInterface.bulkDelete('ventas',         null, {});
    await queryInterface.bulkDelete('bebidas',        null, {});
    await queryInterface.bulkDelete('barras',         null, {});
  },
};
