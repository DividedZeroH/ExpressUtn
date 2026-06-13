// src/seeders/001-initial-data.js
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('barras', [
      { id: 1, numero_barra: 1, sector: 'PLANTA BAJA' },
      { id: 2, numero_barra: 2, sector: 'PRIMER PISO' },
      { id: 3, numero_barra: 3, sector: 'TERRAZA' },
      { id: 4, numero_barra: 4, sector: 'VIP' },
    ]);

    await queryInterface.bulkInsert('bebidas', [
      { id: 1,  nombre: 'CERVEZA RUBIA 500ML',   precio: 1200.00, descripcion: 'Cerveza lager nacional tirada' },
      { id: 2,  nombre: 'CERVEZA NEGRA 500ML',   precio: 1400.00, descripcion: 'Cerveza stout importada' },
      { id: 3,  nombre: 'FERNET CON COCA',       precio: 1500.00, descripcion: 'Fernet Branca con Coca-Cola 330ml' },
      { id: 4,  nombre: 'AGUA MINERAL 500ML',    precio:  600.00, descripcion: 'Agua sin gas' },
      { id: 5,  nombre: 'GASEOSA LATA',          precio:  800.00, descripcion: 'Coca-Cola / Sprite / Fanta 354ml' },
      { id: 6,  nombre: 'VINO COPA TINTO',       precio: 1300.00, descripcion: 'Malbec copa 150ml' },
      { id: 7,  nombre: 'VINO COPA BLANCO',      precio: 1300.00, descripcion: 'Chardonnay copa 150ml' },
      { id: 8,  nombre: 'CAMPARI NARANJA',       precio: 1600.00, descripcion: 'Campari con jugo de naranja' },
      { id: 9,  nombre: 'WHISKY SIMPLE',         precio: 2000.00, descripcion: 'Whisky blend con hielo' },
      { id: 10, nombre: 'JUGO DE NARANJA',       precio:  900.00, descripcion: 'Jugo natural exprimido' },
    ]);

    const ventas = [];
    const detalles = [];
    let detalleId = 1;
    const baseDate = new Date('2025-01-01');

    for (let i = 1; i <= 40; i++) {
      const d = new Date(baseDate.getTime() + (i - 1) * 2 * 24 * 60 * 60 * 1000);
      const fecha = d.toISOString().split('T')[0];
      const hora  = `${String(18 + (i % 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`;

      let total = 0;
      const lineas = (i % 3) + 1;
      const lineasTemp = [];

      for (let j = 0; j < lineas; j++) {
        const bebida_id = ((i + j) % 10) + 1;
        const barra_id  = ((i + j) % 4) + 1;
        const cantidad  = (j + 1);
        const precios   = [1200,1400,1500,600,800,1300,1300,1600,2000,900];
        const subtotal  = cantidad * precios[bebida_id - 1];
        total += subtotal;
        lineasTemp.push({ bebida_id, barra_id, cantidad, subtotal });
      }

      ventas.push({ id: i, numero_venta: 1000 + i, fecha, hora, total });
      for (const l of lineasTemp) {
        detalles.push({ id: detalleId++, venta_id: i, ...l });
      }
    }

    await queryInterface.bulkInsert('ventas', ventas);
    await queryInterface.bulkInsert('detalle_ventas', detalles);

    // Resincronizar secuencias después de insertar con IDs explícitos
    // Sin esto, el próximo INSERT falla con "duplicate key" porque la
    // secuencia sigue apuntando al 1.
    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('barras',        'id'), COALESCE(MAX(id), 0) + 1, false) FROM barras;
      SELECT setval(pg_get_serial_sequence('bebidas',       'id'), COALESCE(MAX(id), 0) + 1, false) FROM bebidas;
      SELECT setval(pg_get_serial_sequence('ventas',        'id'), COALESCE(MAX(id), 0) + 1, false) FROM ventas;
      SELECT setval(pg_get_serial_sequence('detalle_ventas','id'), COALESCE(MAX(id), 0) + 1, false) FROM detalle_ventas;
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_ventas', null, {});
    await queryInterface.bulkDelete('ventas', null, {});
    await queryInterface.bulkDelete('bebidas', null, {});
    await queryInterface.bulkDelete('barras', null, {});
  },
};
