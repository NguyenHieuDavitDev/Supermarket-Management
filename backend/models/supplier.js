"use strict";
module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    "Supplier",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Tên nhà cung cấp không được để trống" },
        },
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "Mã nhà cung cấp không được để trống" },
        },
      },
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: { msg: "Email không hợp lệ" },
        },
      },
      phone: {
        type: DataTypes.STRING,
      },
      address: {
        type: DataTypes.TEXT,
      },
      taxCode: {
        type: DataTypes.STRING,
        field: "tax_code",
      },
      contactPerson: {
        type: DataTypes.STRING,
        field: "contact_person",
      },
      website: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      logo: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true, // Bật chế độ soft delete
      hooks: {
        beforeValidate: (supplier) => {
          // Tự động tạo mã nhà cung cấp nếu không có
          if (!supplier.code && supplier.isNewRecord) {
            const timestamp = new Date().getTime().toString().slice(-6);
            supplier.code = "NCC" + timestamp;
          }

          // Chuẩn hóa số điện thoại
          if (supplier.phone) {
            supplier.phone = supplier.phone.replace(/\s+/g, "");
          }
        },
      },
    }
  );

  Supplier.associate = function (models) {
    // Quan hệ với sản phẩm nếu có
    // Supplier.hasMany(models.Product, { foreignKey: 'supplierId' });
  };

  return Supplier;
};
