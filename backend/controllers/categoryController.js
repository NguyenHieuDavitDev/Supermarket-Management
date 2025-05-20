const { Category } = require("../models"); // Import model Category từ thư mục models
const multer = require("multer"); // Import multer để xử lý upload file
const path = require("path"); // Import path để thao tác đường dẫn và phần mở rộng file

// Cấu hình multer để lưu file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/categories/"); // Chỉ định thư mục lưu file upload
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
    // Đặt tên file là timestamp + phần mở rộng gốc (vd: 1689000000000.jpg)
  },
});

const upload = multer({
  storage: storage, // Sử dụng cấu hình storage đã định nghĩa
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file tối đa 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/; // Định nghĩa các loại file được chấp nhận
    const mimetype = filetypes.test(file.mimetype); // Kiểm tra mime-type của file có hợp lệ không
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    // Kiểm tra phần mở rộng file có hợp lệ không

    if (mimetype && extname) {
      return cb(null, true); // Nếu đúng định dạng, cho phép upload file
    } else {
      cb(new Error("Chỉ chấp nhận file hình ảnh!"));
      // Nếu không đúng định dạng, trả về lỗi
    }
  },
});

exports.uploadCategoryImage = upload.single("image");
// Middleware multer xử lý upload một file duy nhất với tên trường form là "image"

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Category, // Bao gồm model Category để lấy thông tin cha
          as: "parent", // Quan hệ với danh mục cha
          attributes: ["id", "name", "slug"], // Chỉ lấy các trường này cho cha
        },
        {
          model: Category, // Bao gồm model Category để lấy thông tin con
          as: "children", // Quan hệ với danh mục con
          attributes: ["id", "name", "slug"], // Chỉ lấy các trường này cho con
        },
      ],
      order: [["id", "ASC"]], // Sắp xếp theo id tăng dần
    });

    res.json(categories); // Trả về danh sách danh mục dạng JSON
  } catch (error) {
    console.error("Error getting categories:", error); // In lỗi ra console
    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Trả về lỗi 500 với message và chi tiết lỗi
  }
};

// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      // Tìm category theo primary key lấy từ params
      include: [
        {
          model: Category,
          as: "parent", // Lấy thông tin danh mục cha
          attributes: ["id", "name", "slug"], // Chỉ lấy các trường cần thiết
        },
        {
          model: Category,
          as: "children", // Lấy thông tin danh mục con
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
      // Nếu không tìm thấy danh mục, trả về lỗi 404
    }

    res.json(category); // Trả về dữ liệu danh mục dưới dạng JSON
  } catch (error) {
    console.error("Error getting category:", error); // In lỗi ra console
    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Trả về lỗi server 500 với message lỗi
  }
};

// Thêm danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description, status, parentId } = req.body;
    // Lấy dữ liệu gửi từ client qua body

    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
      // Kiểm tra nếu không có tên thì trả lỗi 400
    }

    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      // Nếu có parentId, kiểm tra danh mục cha có tồn tại không
      if (!parentCategory) {
        return res.status(400).json({ message: "Danh mục cha không tồn tại" });
        // Nếu không tồn tại cha, trả lỗi 400
      }
    }

    let image = null; // Khởi tạo biến chứa đường dẫn ảnh
    if (req.file) {
      image = req.file.path; // Nếu có file upload, lấy đường dẫn ảnh
    }

    const newCategory = await Category.create({
      name, // Tên danh mục
      description, // Mô tả danh mục
      status: status === undefined ? true : status, // Mặc định status true nếu không có
      parentId: parentId || null, // parentId hoặc null nếu không có
      image, // Ảnh danh mục
    });

    res.status(201).json(newCategory); // Trả về danh mục vừa tạo với status 201
  } catch (error) {
    console.error("Error creating category:", error); // In lỗi ra console

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Slug đã tồn tại, vui lòng chọn tên khác",
      });
      // Nếu lỗi trùng slug trả lỗi 400 và thông báo
    }

    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Các lỗi khác trả lỗi server 500
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, status, parentId } = req.body; // Lấy dữ liệu cập nhật
    const categoryId = req.params.id; // Lấy id danh mục cần cập nhật

    const category = await Category.findByPk(categoryId); // Tìm danh mục theo id
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
      // Nếu không tìm thấy trả lỗi 404
    }

    if (parentId) {
      if (parentId == categoryId) {
        return res.status(400).json({
          message: "Danh mục không thể là cha của chính nó",
        });
        // Kiểm tra không cho danh mục làm cha chính nó
      }

      const parentCategory = await Category.findByPk(parentId);
      // Kiểm tra danh mục cha có tồn tại không
      if (!parentCategory) {
        return res.status(400).json({ message: "Danh mục cha không tồn tại" });
      }
    }

    let image = category.image; // Lấy giá trị ảnh hiện tại
    if (req.file) {
      image = req.file.path; // Nếu có file mới upload, cập nhật lại đường dẫn ảnh
    }

    await category.update({
      name: name || category.name, // Cập nhật tên hoặc giữ nguyên nếu không có
      description:
        description !== undefined ? description : category.description,
      // Cập nhật mô tả hoặc giữ nguyên
      status: status !== undefined ? status : category.status, // Cập nhật status hoặc giữ nguyên
      parentId: parentId !== undefined ? parentId : category.parentId, // Cập nhật parentId hoặc giữ nguyên
      image, // Cập nhật ảnh
    });

    res.json(category); // Trả về danh mục đã cập nhật
  } catch (error) {
    console.error("Error updating category:", error); // In lỗi ra console

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Slug đã tồn tại, vui lòng chọn tên khác",
      });
      // Bắt lỗi trùng slug trả về lỗi 400
    }

    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Các lỗi khác trả về lỗi server 500
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; // Lấy id danh mục cần xóa

    const category = await Category.findByPk(categoryId); // Tìm danh mục theo id
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
      // Nếu không tìm thấy trả lỗi 404
    }

    const childrenCount = await Category.count({
      where: { parentId: categoryId },
    }); // Đếm số danh mục con của danh mục này

    if (childrenCount > 0) {
      return res.status(400).json({
        message:
          "Không thể xóa danh mục này vì có chứa danh mục con. Vui lòng xóa tất cả danh mục con trước.",
      });
      // Nếu còn danh mục con, không cho xóa và trả lỗi 400
    }

    await category.destroy(); // Thực hiện xóa danh mục (soft hoặc hard tùy model)

    res.json({ message: "Xóa danh mục thành công" }); // Trả về thông báo thành công
  } catch (error) {
    console.error("Error deleting category:", error); // In lỗi ra console
    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Trả lỗi server 500 nếu có lỗi
  }
};
