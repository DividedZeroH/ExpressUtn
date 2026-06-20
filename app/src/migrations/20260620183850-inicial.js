'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('barras', {
      id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      numero_barra: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      sector:       { type: Sequelize.STRING(100), allowNull: false },
    });

    await queryInterface.createTable('bebidas', {
      id:          { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre:      { type: Sequelize.STRING(200), allowNull: false, unique: true },
      precio:      { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
    });

    await queryInterface.createTable('ventas', {
      id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      numero_venta: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      fecha:        { type: Sequelize.DATEONLY, allowNull: false },
      hora:         { type: Sequelize.TIME, allowNull: false },
      total:        { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    });

    await queryInterface.createTable('detalle_ventas', {
      id:       { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      venta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ventas', key: 'id' },
        onDelete: 'RESTRICT',
      },
      bebida_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'bebidas', key: 'id' },
        onDelete: 'RESTRICT',
      },
      barra_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'barras', key: 'id' },
        onDelete: 'RESTRICT',
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      subtotal: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_ventas');
    await queryInterface.dropTable('ventas');
    await queryInterface.dropTable('bebidas');
    await queryInterface.dropTable('barras');
  },
};
