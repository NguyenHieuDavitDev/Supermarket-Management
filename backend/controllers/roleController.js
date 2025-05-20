const { Role } = require("../models");
// Import model Role từ thư mục models (có thể index.js export tất cả model)

// Lấy danh sách tất cả vai trò
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    // Lấy tất cả bản ghi trong bảng Role
    res.status(200).json(roles);
    // Trả về dữ liệu danh sách vai trò với status 200 (OK)
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách vai trò", error });
    // Nếu lỗi, trả về status 500 và thông báo lỗi kèm chi tiết lỗi
  }
};

// Thêm vai trò mới
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    // Lấy trường name từ request body

    if (!name)
      return res.status(400).json({ message: "Tên vai trò là bắt buộc" });
    // Nếu không có name, trả về lỗi 400 (Bad Request)

    const role = await Role.create({ name });
    // Tạo mới bản ghi Role với trường name

    res.status(201).json(role);
    // Trả về bản ghi vừa tạo với status 201 (Created)
  } catch (error) {
    console.error("Lỗi chi tiết khi tạo vai trò:", error);
    // In chi tiết lỗi ra console để debug

    res
      .status(500)
      .json({ message: "Lỗi khi tạo vai trò", error: error.message });
    // Trả về lỗi 500 và message lỗi
  }
};

// Cập nhật vai trò theo id
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id vai trò từ tham số URL

    const { name } = req.body;
    // Lấy tên mới từ body

    const role = await Role.findByPk(id);
    // Tìm role theo primary key (id)

    if (!role)
      return res.status(404).json({ message: "Vai trò không tồn tại" });
    // Nếu không tìm thấy role, trả về lỗi 404

    role.name = name;
    // Gán tên mới cho role

    await role.save();
    // Lưu cập nhật vào DB

    res.status(200).json(role);
    // Trả về role đã được cập nhật
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật vai trò", error });
    // Nếu lỗi, trả về lỗi 500 và chi tiết lỗi
  }
};

// Xóa vai trò theo id
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id vai trò từ tham số URL

    const role = await Role.findByPk(id);
    // Tìm role theo id

    if (!role)
      return res.status(404).json({ message: "Vai trò không tồn tại" });
    // Nếu không tìm thấy role, trả về lỗi 404

    await role.destroy();
    // Xóa role khỏi DB

    res.status(200).json({ message: "Xóa vai trò thành công" });
    // Trả về thông báo xóa thành công
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa vai trò", error });
    // Nếu lỗi, trả về lỗi 500 và chi tiết lỗi
  }
};
