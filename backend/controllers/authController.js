const bcrypt = require("bcryptjs");
// Import thư viện bcryptjs để mã hóa và so sánh mật khẩu (mặc dù trong đoạn code này chưa dùng)

const jwt = require("jsonwebtoken");
// Import thư viện jsonwebtoken để tạo và xác thực JWT token

const { User } = require("../models");
// Import model User từ thư mục models để truy vấn dữ liệu user trong database

require("dotenv").config();
// Load biến môi trường từ file .env vào process.env (dùng để lấy JWT_SECRET)

exports.login = async (req, res) => {
  const { email, password } = req.body;
  // Lấy email và password người dùng gửi trong request body

  try {
    console.log("Login attempt:", { email, password });
    // In thông tin đăng nhập ra console để debug

    const user = await User.findOne({ where: { email } });
    // Tìm user trong database có email trùng với email gửi lên

    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
      // Nếu không tìm thấy user, trả về lỗi 401 kèm thông báo tài khoản không tồn tại
    }

    // Kiểm tra mật khẩu trực tiếp vì mật khẩu đang lưu dạng cleartext
    if (user.password !== password) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
      // So sánh mật khẩu nhập với mật khẩu lưu trong DB (chưa mã hóa)
      // Nếu không đúng, trả về lỗi 401 kèm thông báo mật khẩu không đúng
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      // Payload trong token gồm id và role của user

      process.env.JWT_SECRET || "your_jwt_secret",
      // Bí mật dùng để mã hóa token lấy từ biến môi trường hoặc mặc định

      { expiresIn: "1h" }
      // Token có thời hạn 1 giờ
    );

    req.session.token = token;
    // Lưu token vào session của người dùng trên server

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      // Trả về thông tin user và token cho client
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    // Nếu có lỗi trong quá trình xử lý, in lỗi ra console

    res.status(500).json({ message: "Lỗi server" });
    // Trả về lỗi server 500 cho client
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    // Huỷ session hiện tại để đăng xuất người dùng
    res.json({ message: "Đăng xuất thành công" });
    // Trả về thông báo đăng xuất thành công
  });
};

exports.checkAuth = (req, res) => {
  res.status(200).json({
    authenticated: true,
    // Xác nhận người dùng đã xác thực thành công

    user: req.user,
    // Gửi thông tin user đã được gán ở middleware xác thực (nếu có)
  });
};
