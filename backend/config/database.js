const { Sequelize } = require("sequelize");
require("dotenv").config();

// Tạo kết nối Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || "management_demo",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false, // Tắt logging SQL queries
    timezone: "+07:00", // Timezone cho Việt Nam
    dialectOptions: {
      // Cấu hình tùy chọn cho MySQL
      dateStrings: true,
      typeCast: true,
    },
    define: {
      // Các tùy chọn mặc định cho các model
      timestamps: true, // Tự động tạo createdAt, updatedAt
      underscored: false, // Sử dụng camelCase cho tên cột
      freezeTableName: false, // Không đóng băng tên bảng
      charset: "utf8mb4", // Hỗ trợ ký tự Unicode và emoji
      collate: "utf8mb4_unicode_ci",
    },
    pool: {
      // Cấu hình connection pool
      max: 5, // Số lượng kết nối tối đa
      min: 0, // Số lượng kết nối tối thiểu
      acquire: 30000, // Thời gian tối đa để lấy kết nối (ms)
      idle: 10000, // Thời gian tối đa cho phép kết nối idle (ms)
    },
  }
);

// Kiểm tra kết nối
sequelize
  .authenticate()
  .then(() => {
    console.log("Kết nối cơ sở dữ liệu thành công.");
  })
  .catch((err) => {
    console.error("Không thể kết nối đến cơ sở dữ liệu:", err);
  });

module.exports = sequelize;
