"use strict";
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Tên danh mục không được để trống" },
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      image: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      parentId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Categories",
          key: "id",
        },
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true, // Bật chế độ soft delete
      hooks: {
        beforeValidate: (category) => {
          // Tạo slug từ tên danh mục
          if (category.name && (!category.slug || category.changed("name"))) {
            category.slug = category.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w\-]+/g, "")
              .replace(/\-\-+/g, "-")
              .trim();
          }
        },
      },
    }
  );

  Category.associate = function (models) {
    // Tự tham chiếu - danh mục cha - con
    Category.belongsTo(Category, {
      as: "parent",
      foreignKey: "parentId",
    });

    Category.hasMany(Category, {
      as: "children",
      foreignKey: "parentId",
    });

    // Quan hệ với sản phẩm nếu có
    // Category.hasMany(models.Product, { foreignKey: 'categoryId' });
  };

  return Category;
};
