const express = require("express"); // Framework Express để tạo ứng dụng web
const cors = require("cors"); // Middleware xử lý CORS (Cross-Origin Resource Sharing)
const session = require("express-session"); // Middleware quản lý session
const dotenv = require("dotenv"); // Đọc biến môi trường từ file .env
const fs = require("fs"); // Module file system, dùng để thao tác thư mục/file
const path = require("path"); // Module path, để xây dựng đường dẫn tệp một cách an toàn

dotenv.config(); // Load biến môi trường từ file .env

const app = express(); // Tạo instance của Express
const port = process.env.PORT || 3000;
// Lấy port từ biến môi trường PORT, nếu không có thì mặc định là 3000

// ===== Middleware cơ bản =====

// Cho phép ứng dụng parse JSON trong request body
app.use(express.json());

// Cho phép parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Cấu hình CORS
app.use(
  cors({
    origin: "http://localhost:3001",
    // Chỉ cho phép frontend tại http://localhost:3001 gửi request

    credentials: true,
    // Cho phép gửi kèm cookie trong request (để dùng session)

    exposedHeaders: ["set-cookie"],
    // Cho phép client đọc header 'set-cookie' từ response
  })
);

// Cấu hình session (lưu phiên làm việc của user)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret_key",
    // Dùng để mã hóa session ID

    resave: false,
    // Không lưu session nếu không có sự thay đổi

    saveUninitialized: true,
    // Tạo session mới ngay cả khi chưa có dữ liệu

    cookie: { secure: false, httpOnly: true },
    // secure: false vì đang chạy HTTP (nếu chạy HTTPS thì bật true)
    // httpOnly: true để ngăn JavaScript trên client truy cập cookie
  })
);

// Danh sách các thư mục cần tạo nếu chưa có
const uploadDirs = [
  "uploads",
  "uploads/categories",
  "uploads/suppliers",
  "uploads/products",
];

uploadDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  // Tạo đường dẫn tuyệt đối: <project_root>/<dir>

  if (!fs.existsSync(dirPath)) {
    // Nếu thư mục chưa tồn tại
    fs.mkdirSync(dirPath, { recursive: true });
    // Tạo thư mục, recursive: true để tạo luôn các thư mục cha (nếu cần)

    console.log(`Created directory: ${dirPath}`);
    // In ra console tên thư mục vừa được tạo
  }
});

// ===== Serve static files =====
// Khi client truy cập /uploads/..., trả về file tương ứng từ thư mục uploads
app.use("/uploads", express.static("uploads"));

// ===== Import routes =====
// Các route riêng biệt cho từng tính năng
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
// authMiddleware kiểm tra token/session trước khi vào các route bảo vệ

// ===== Đăng ký các API routes =====

// Route cho xác thực (đăng nhập, đăng ký, logout…)
app.use("/api/auth", authRoutes);
// Các route trong authRoutes sẽ dùng base path /api/auth

// ===== Tạo hai router riêng biệt: publicRouter & dashboardRouter =====
// publicRouter: các endpoint không yêu cầu đăng nhập
// dashboardRouter: các endpoint yêu cầu user đã xác thực

const publicRouter = express.Router();
const dashboardRouter = express.Router();

// ----- Public Routes (công khai) -----
// Đăng ký publicRouter tại base path /api/store
app.use("/api/store", publicRouter);

// GET /api/store/
// Trả về thông báo chào mừng cho trang store
publicRouter.get("/", (req, res) => {
  res.json({ message: "Chào mừng đến với trang store!" });
});

// Cho phép client truy cập danh mục công khai (không cần đăng nhập)
publicRouter.use("/categories", categoryRoutes);
// Các route trong categoryRoutes sẽ dùng base path /api/store/categories

// ----- Dashboard Routes (yêu cầu đăng nhập) -----
// Gắn middleware authMiddleware trước khi vào dashboardRouter
app.use("/api/dashboard", authMiddleware, dashboardRouter);
// Khi có request tới /api/dashboard/*, trước hết phải qua authMiddleware

// Đăng ký các route quản lý người dùng, vai trò, danh mục, nhà cung cấp, sản phẩm
dashboardRouter.use("/users", userRoutes);
// Các route trong userRoutes sẽ dùng base path /api/dashboard/users

dashboardRouter.use("/roles", roleRoutes);
// Các route trong roleRoutes sẽ dùng base path /api/dashboard/roles

dashboardRouter.use("/categories", categoryRoutes);
// Các route trong categoryRoutes sẽ dùng base path /api/dashboard/categories

dashboardRouter.use("/suppliers", supplierRoutes);
// Các route trong supplierRoutes sẽ dùng base path /api/dashboard/suppliers

dashboardRouter.use("/products", productRoutes);
// Các route trong productRoutes sẽ dùng base path /api/dashboard/products

// GET /api/dashboard/
// Trả về thông báo chào mừng cho dashboard (Admin)
dashboardRouter.get("/", (req, res) => {
  res.json({ message: "Chào mừng đến dashboard admin!" });
});

// ===== Khởi động server =====
app.listen(port, () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
});

