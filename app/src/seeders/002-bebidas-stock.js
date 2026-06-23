'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE bebidas SET stock = CASE 
        WHEN id = 1 THEN 50
        WHEN id = 2 THEN 50
        WHEN id = 3 THEN 100
        WHEN id = 4 THEN 75
        WHEN id = 5 THEN 60
        WHEN id = 6 THEN 40
        WHEN id = 7 THEN 35
        WHEN id = 8 THEN 80
        WHEN id = 9 THEN 80
        WHEN id = 10 THEN 100
      END;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE bebidas SET stock = NULL;
    `);
  }
};