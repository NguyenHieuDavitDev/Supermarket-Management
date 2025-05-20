const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");

// Import các model
const userModel = require("./user");
const roleModel = require("./role");
const categoryModel = require("./category");
const supplierModel = require("./supplier");
const Product = require("./Product");
const ProductImage = require("./ProductImage");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// Khởi tạo các model
const User = userModel(sequelize, DataTypes);
const Role = roleModel(sequelize, DataTypes);
const Category = categoryModel(sequelize, DataTypes);
const Supplier = supplierModel(sequelize, DataTypes);

// Thiết lập các mối quan hệ
// User - Role
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Role.hasMany(User, { foreignKey: "roleId", as: "users" });

// Category - Category (self-referencing)
Category.belongsTo(Category, { foreignKey: "parentId", as: "parent" });
Category.hasMany(Category, { foreignKey: "parentId", as: "children" });

// Product - Category
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });

// Product - Supplier
Product.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
Supplier.hasMany(Product, { foreignKey: "supplierId", as: "products" });

// Product - ProductImage
Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Order - OrderItem relationship (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// Order - User relationship (Many-to-One)
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Order - Product relationship (through OrderItem)
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

module.exports = {
  User,
  Role,
  Category,
  Supplier,
  Product,
  ProductImage,
  Order,
  OrderItem,
  sequelize,
  Sequelize,
};
