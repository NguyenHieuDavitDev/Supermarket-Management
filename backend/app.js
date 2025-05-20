const express = require("express");
// Import Express để tạo ứng dụng web

const cors = require("cors");
// Import CORS middleware, cho phép cấu hình chính sách chia sẻ tài nguyên giữa các nguồn

const path = require("path");
// Import path để xử lý đường dẫn trong hệ thống file

const cookieParser = require("cookie-parser");
// Import cookieParser để parse cookie từ request

// Import các route handler từ thư mục routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Tạo một instance của ứng dụng Express
const app = express();

// --- Cấu hình và gắn CORS middleware ---
// Cho phép các domain frontend truy cập API, và cho phép gửi cookie/tokens
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    // Chỉ cho phép front-end (port 3000 & 3001) thực hiện request
    credentials: true,
    // Cho phép gửi kèm cookie trên request
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // Các phương thức HTTP được phép
    allowedHeaders: ["Content-Type", "Authorization"],
    // Cho phép các header Content-Type và Authorization được gửi
  })
);

// Middleware để parse body của request ở dạng JSON
app.use(express.json());
// Middleware để parse URL-encoded data (form submissions)
app.use(express.urlencoded({ extended: true }));
// Middleware để parse cookie gắn trên request
app.use(cookieParser());

// --- Serve static files (ảnh, video, tài liệu) ---
// Khi client truy cập /uploads/… thì Express sẽ trả về file tương ứng từ thư mục ./uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- các route API ---
// Cấu trúc: app.use("<base-path>", <router>)
// Khi nhận request bắt đầu bằng base-path, sẽ chuyển tiếp cho router tương ứng

// Các route liên quan đến xác thực (đăng nhập, đăng ký, logout…)
app.use("/api/auth", authRoutes);

// Các route liên quan đến quản lý người dùng (CRUD user)
app.use("/api/dashboard/users", userRoutes);

// Các route liên quan đến quản lý vai trò (CRUD role)
app.use("/api/dashboard/roles", roleRoutes);

// Các route liên quan đến quản lý danh mục (CRUD category)
app.use("/api/dashboard/categories", categoryRoutes);

// Các route liên quan đến quản lý nhà cung cấp (CRUD supplier)
app.use("/api/dashboard/suppliers", supplierRoutes);

// Các route liên quan đến quản lý sản phẩm (CRUD product)
app.use("/api/dashboard/products", productRoutes);

// Các route liên quan đến quản lý đơn hàng (CRUD order)
app.use("/api/dashboard/orders", orderRoutes);

// --- Route mặc định khi truy cập root ---
// Khi người dùng truy cập GET /, trả về thông báo API đang chạy
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

// --- Error handling middleware ---
// Đây là middleware cuối cùng, bắt tất cả lỗi không được xử lý ở các tầng trước
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  // Log lỗi ra console

  res.status(500).json({
    message: "Đã xảy ra lỗi trên máy chủ",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
    // Nếu đang ở môi trường development, trả về chi tiết lỗi
  });
});

// --- 404 route ---
// Nếu không có route nào khớp, middleware này sẽ chạy cuối cùng
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy tài nguyên yêu cầu" });
});

// Xuất ứng dụng để file server (ví dụ index.js) import và khởi chạy
module.exports = app;
