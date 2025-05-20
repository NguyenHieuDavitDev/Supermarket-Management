"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Tạo role admin
      await queryInterface.sequelize.query(`
        INSERT INTO Roles (name, createdAt, updatedAt)
        VALUES ('admin', NOW(), NOW());
      `);

      // Tạo user admin
      await queryInterface.sequelize.query(`
        INSERT INTO Users (username, email, password, roleId, createdAt, updatedAt)
        VALUES ('admin', 'admin@example.com', 'admin123', 1, NOW(), NOW());
      `);

      console.log("Seed thành công!");
    } catch (error) {
      console.error("Lỗi khi seed:", error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(`
        DELETE FROM Users WHERE email = 'admin@example.com';
      `);
      await queryInterface.sequelize.query(`
        DELETE FROM Roles WHERE name = 'admin';
      `);
    } catch (error) {
      console.error("Lỗi khi rollback seed:", error);
    }
  },
};
