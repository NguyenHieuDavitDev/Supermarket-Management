const jwt = require("jsonwebtoken");
// Import thư viện jsonwebtoken để tạo và xác thực JWT

require("dotenv").config();
// Load biến môi trường từ file .env (ví dụ JWT_SECRET)

exports.authMiddleware = (req, res, next) => {
  // Middleware xác thực, được gắn vào các route cần bảo vệ

  // Lấy token từ session hoặc header Authorization
  const token =
    req.session.token ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null);
  // - Nếu req.session.token tồn tại (đã lưu token trong session), dùng nó
  // - Ngược lại nếu header Authorization có dạng "Bearer <token>", tách token sau khoảng trắng
  // - Nếu không tìm được, token = null

  if (!token) {
    console.log("Authentication failed: No token provided");
    // In log để debug khi không có token

    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    // Trả về 401 Unauthorized nếu không có token
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    // Giải mã và kiểm tra token bằng phương thức jwt.verify
    // - token: giá trị token lấy được
    // - secret: lấy từ biến môi trường JWT_SECRET, nếu không có thì dùng "your_jwt_secret"
    // Nếu token không hợp lệ hoặc hết hạn, sẽ ném lỗi vào catch

    console.log("Authentication successful for user:", decoded);
    // In thông tin đã giải mã (payload) để debug

    req.user = decoded;
    // Gán thông tin user đã giải mã vào req.user để các route phía sau có thể sử dụng

    next();
    // Đẩy luồng sang middleware hoặc route handler tiếp theo
  } catch (error) {
    console.error("Authentication error:", error.message);
    // In lỗi xác thực (ví dụ token hết hạn hoặc không hợp lệ)

    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    // Trả về 403 Forbidden nếu token sai hoặc hết hạn
  }
};
