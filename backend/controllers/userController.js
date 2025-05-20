const { User } = require("../models");
// Import model User từ thư mục models

const multer = require("multer");
// Import thư viện multer để xử lý upload file

const path = require("path");
// Import path để xử lý đường dẫn và mở rộng tên file

// Cấu hình multer để lưu ảnh upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Định nghĩa thư mục lưu file upload
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Đặt tên file upload là timestamp + phần mở rộng gốc
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Khởi tạo middleware upload với cấu hình trên
const upload = multer({ storage: storage });

// Middleware dùng để upload 1 file với tên field là 'avatar'
exports.uploadAvatar = upload.single("avatar");

// Hàm tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    // Debug: In thông tin body và file upload lên console
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    // Lấy các trường từ body
    const { username, email, password, roleId } = req.body;

    // Kiểm tra dữ liệu bắt buộc: username, email, password
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email và password là bắt buộc" });
    }

    // Nếu có file upload, lấy đường dẫn file, nếu không avatar = null
    let avatar = req.file ? req.file.path : null;

    // Tạo bản ghi User mới trong DB
    const newUser = await User.create({
      username,
      email,
      password,
      roleId,
      avatar,
    });

    // Trả về user vừa tạo với status 201 (Created)
    res.status(201).json(newUser);
  } catch (error) {
    // Nếu có lỗi, log lỗi và trả về status 500
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Hàm lấy danh sách tất cả người dùng
exports.getUsers = async (req, res) => {
  try {
    // Lấy tất cả user trong DB
    const users = await User.findAll();

    // Trả về danh sách người dùng
    res.json(users);
  } catch (error) {
    // Nếu lỗi, trả về lỗi 500 kèm thông báo
    res.status(500).json({ error: error.message });
  }
};

// Hàm lấy người dùng theo id
exports.getUserById = async (req, res) => {
  try {
    // Tìm user theo primary key từ params.id
    const user = await User.findByPk(req.params.id);

    // Nếu không tìm thấy, trả về 404
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Trả về user tìm được
    res.json(user);
  } catch (error) {
    // Nếu lỗi, trả về lỗi 500 kèm thông báo
    res.status(500).json({ error: error.message });
  }
};

// Hàm cập nhật thông tin người dùng theo id
exports.updateUser = async (req, res) => {
  try {
    // Lấy các trường mới từ body
    const { username, email, password, roleId } = req.body;

    // Tìm user theo id từ params
    const user = await User.findByPk(req.params.id);

    // Nếu không tìm thấy user, trả về 404
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Lấy avatar cũ
    let avatar = user.avatar;

    // Nếu có file mới upload, cập nhật avatar mới
    if (req.file) {
      avatar = req.file.path;
    }

    // Cập nhật user với dữ liệu mới
    await user.update({ username, email, password, roleId, avatar });

    // Trả về user đã cập nhật
    res.json(user);
  } catch (error) {
    // Nếu lỗi, trả về lỗi 500 kèm thông báo
    res.status(500).json({ error: error.message });
  }
};

// Hàm xóa user (soft delete nếu model có paranoid)
exports.deleteUser = async (req, res) => {
  try {
    // Tìm user theo id
    const user = await User.findByPk(req.params.id);

    // Nếu không tìm thấy, trả về 404
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Gọi phương thức destroy để xóa (soft delete nếu có paranoid)
    await user.destroy();

    // Trả về thông báo thành công
    res.json({ message: "Xóa người dùng thành công (soft delete)" });
  } catch (error) {
    // Nếu lỗi, trả về lỗi 500 kèm thông báo
    res.status(500).json({ error: error.message });
  }
};
