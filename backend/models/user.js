"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      avatar: { type: DataTypes.STRING }, // đường dẫn ảnh
      roleId: { type: DataTypes.INTEGER },
      deletedAt: { type: DataTypes.DATE }, // soft delete
    },
    {
      paranoid: true, // bật chế độ soft delete của sequelize
    }
  );
  User.associate = function (models) {
    User.belongsTo(models.Role, { foreignKey: "roleId" });
  };
  return User;
};
