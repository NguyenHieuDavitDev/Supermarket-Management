const { Supplier } = require("../models"); // Import model Supplier từ thư mục models để thao tác với bảng nhà cung cấp
const multer = require("multer"); // Import multer để xử lý upload file (logo nhà cung cấp)
const path = require("path"); // Import path để thao tác với đường dẫn và phần mở rộng tên file
const fs = require("fs"); // Import fs để làm việc với hệ thống file (đọc, xóa, tạo thư mục)
const { Op } = require("sequelize"); // Import Op (Operators) từ Sequelize để xây dựng điều kiện truy vấn nâng cao

// Cấu hình Multer cho upload logo nhà cung cấp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/suppliers/"); // Định nghĩa thư mục lưu file upload (uploads/suppliers/)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Tạo chuỗi ngẫu nhiên để đảm bảo tên file không trùng lặp (timestamp + random số)
    cb(null, `supplier-${uniqueSuffix}${path.extname(file.originalname)}`);
    // Đặt tên file: prefix 'supplier-' + uniqueSuffix + phần mở rộng gốc (vd: .jpg, .png)
  },
});

const upload = multer({
  storage: storage, // Sử dụng cấu hình storage đã định nghĩa ở trên
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file tối đa 5MB
  fileFilter: function (req, file, cb) {
    // Hàm lọc file, chỉ chấp nhận các định dạng ảnh
    const filetypes = /jpeg|jpg|png|gif|webp|svg/; // Định nghĩa các định dạng ảnh hợp lệ
    const mimetype = filetypes.test(file.mimetype);
    // Kiểm tra mime-type của file upload có khớp với định dạng cho phép không
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    // Kiểm tra phần mở rộng của tên file (lowercase) có hợp lệ không

    if (mimetype && extname) {
      return cb(null, true); // Nếu thỏa mãn cả mime-type và phần mở rộng, cho phép upload
    } else {
      cb(
        new Error(
          "Chỉ chấp nhận file hình ảnh (jpg, jpeg, png, gif, webp, svg)"
        )
      );
      // Nếu không hợp lệ, trả về lỗi và không cho upload
    }
  },
});

exports.uploadLogo = upload.single("logo");
// Middleware Multer xử lý upload một file với field name là "logo"

// Helper function to save file locally
const saveFile = (file, folder = "suppliers") => {
  const uploadDir = path.join(__dirname, "..", "uploads", folder);
  // Xây dựng đường dẫn thư mục lưu file: /project/uploads/suppliers
  const filename = `${folder}-${Date.now()}-${path.basename(file.path)}`;
  // Tạo tên file mới: prefix folder + timestamp + basename của file tạm
  const targetPath = path.join(uploadDir, filename);
  // Xây dựng đường dẫn đầy đủ tới file đích: /project/uploads/suppliers/folder-timestamp-basename.ext

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    // Nếu thư mục chưa tồn tại, tạo mới (recursive: tạo cả các thư mục cha nếu cần)
  }

  // Copy file từ đường dẫn tạm (file.path) sang thư mục đích
  fs.copyFileSync(file.path, targetPath);

  return {
    url: `/uploads/${folder}/${filename}`, // Đường dẫn public để truy cập file
    publicId: filename, // Tên file dùng làm ID công khai
  };
};

// Lấy tất cả nhà cung cấp với phân trang và tìm kiếm
exports.getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Lấy thông số trang từ query (page), mặc định trang 1 nếu không truyền
    const limit = parseInt(req.query.limit) || 10;
    // Lấy số items/trang từ query (limit), mặc định 10 nếu không truyền
    const offset = (page - 1) * limit;
    // Tính offset để phân trang: (trang - 1) * số items/trang
    const search = req.query.search || "";
    // Lấy từ khóa tìm kiếm từ query (search), mặc định chuỗi rỗng nếu không truyền

    let whereClause = {};
    // Khởi tạo điều kiện truy vấn rỗng
    if (search) {
      whereClause = {
        [Op.or]: [
          // Sử dụng toán tử OR để tìm kiếm trong nhiều trường
          { name: { [Op.like]: `%${search}%` } },
          // Tìm name chứa từ khóa (SQL LIKE %search%)
          { code: { [Op.like]: `%${search}%` } },
          // Tìm code chứa từ khóa
          { email: { [Op.like]: `%${search}%` } },
          // Tìm email chứa từ khóa
          { phone: { [Op.like]: `%${search}%` } },
          // Tìm phone chứa từ khóa
        ],
      };
    }

    const { count, rows } = await Supplier.findAndCountAll({
      where: whereClause, // Điều kiện tìm kiếm (có hoặc không có)
      limit, // Số bản ghi lấy
      offset, // Bỏ qua offset bản ghi phía trước
      order: [["createdAt", "DESC"]], // Sắp xếp theo createdAt giảm dần (mới nhất trước)
    });

    // Trả về kết quả dưới dạng JSON với thông tin phân trang
    return res.status(200).json({
      suppliers: rows || [], // Danh sách nhà cung cấp (mảng, dù rỗng cũng trả mảng)
      totalPages: Math.ceil(count / limit),
      // Tổng số trang = ceil(tổng items / limit)
      currentPage: page, // Trang hiện tại
      totalItems: count, // Tổng số items (bản ghi) tìm được
    });
  } catch (error) {
    console.error("Error getting suppliers:", error); // In lỗi ra console để debug
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách nhà cung cấp",
      error: error.message,
      // Trả về mã 500 và thông báo lỗi chi tiết
    });
  }
};

// Lấy nhà cung cấp theo ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params; // Lấy id nhà cung cấp từ tham số URL
    const supplier = await Supplier.findByPk(id);
    // Tìm bản ghi Supplier theo primary key (id)

    if (!supplier) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
      // Nếu không tìm thấy, trả về lỗi 404
    }

    return res.status(200).json(supplier);
    // Nếu tìm thấy, trả về nhà cung cấp với status 200
  } catch (error) {
    console.error("Error getting supplier:", error); // In lỗi ra console
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin nhà cung cấp" });
    // Trả về lỗi 500 nếu có exception
  }
};

// Thêm nhà cung cấp mới
exports.createSupplier = async (req, res) => {
  try {
    const {
      name,
      code,
      email,
      phone,
      address,
      taxCode,
      contactPerson,
      website,
      description,
      status,
    } = req.body;
    // Lấy các trường dữ liệu từ request body

    // Kiểm tra tên nhà cung cấp bắt buộc phải có
    if (!name) {
      return res.status(400).json({ message: "Tên nhà cung cấp là bắt buộc" });
    }

    // Kiểm tra mã nhà cung cấp nếu có truyền code
    if (code) {
      const existingSupplier = await Supplier.findOne({ where: { code } });
      // Tìm kiếm nhà cung cấp có code trùng
      if (existingSupplier) {
        return res.status(400).json({ message: "Mã nhà cung cấp đã tồn tại" });
        // Nếu tồn tại, trả về lỗi 400
      }
    }

    // Xử lý logo nếu có file upload (req.file)
    let logoUrl = null;
    if (req.file) {
      const fileData = saveFile(req.file, "suppliers");
      // Gọi helper saveFile để copy file vào thư mục uploads/suppliers
      logoUrl = fileData.url; // Lấy đường dẫn public của file vừa lưu
    }

    const newSupplier = await Supplier.create({
      name, // Tên nhà cung cấp
      code, // Mã nhà cung cấp (nếu có)
      email, // Email liên hệ
      phone, // Số điện thoại
      address, // Địa chỉ
      taxCode, // Mã số thuế
      contactPerson, // Người liên hệ
      website, // Website
      description, // Mô tả
      status:
        status === undefined ? true : status === "true" || status === true,
      // Nếu không truyền status, mặc định true; nếu truyền "true"/true, chuyển thành boolean true
      logo: logoUrl, // Đường dẫn logo (nếu có)
    });

    res.status(201).json(newSupplier);
    // Trả về nhà cung cấp vừa tạo với status 201 (Created)
  } catch (error) {
    console.error("Error creating supplier:", error); // In lỗi ra console
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Mã nhà cung cấp đã tồn tại" });
      // Nếu lỗi trùng unique (code), trả về lỗi 400
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: error.errors.map((e) => ({
          field: e.path, // Trường nào lỗi
          message: e.message, // Thông báo lỗi chi tiết
        })),
      });
      // Nếu lỗi validate, trả về lỗi 400 với danh sách lỗi
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Các lỗi khác trả về lỗi 500
  }
};

// Cập nhật nhà cung cấp
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id nhà cung cấp từ params URL
    const {
      name,
      code,
      email,
      phone,
      address,
      taxCode,
      contactPerson,
      website,
      description,
      status,
    } = req.body;
    // Lấy các trường dữ liệu mới từ body

    // Check if supplier exists
    const supplier = await Supplier.findByPk(id);
    // Tìm nhà cung cấp theo id
    if (!supplier) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
      // Nếu không tìm thấy, trả về lỗi 404
    }

    // Check if code already exists (if changed)
    if (code !== supplier.code) {
      // Nếu code mới khác code hiện tại
      const existingSupplier = await Supplier.findOne({ where: { code } });
      // Tìm nhà cung cấp có code mới
      if (existingSupplier) {
        return res.status(400).json({ message: "Mã nhà cung cấp đã tồn tại" });
        // Nếu tồn tại, trả về lỗi 400
      }
    }

    // Xử lý logo nếu có upload mới
    let logoUrl = supplier.logo; // Lấy logo cũ
    if (req.file) {
      // Nếu có file mới được upload
      if (supplier.logo) {
        // Nếu trước đó có logo cũ
        const oldLogoPath = path.join(
          __dirname,
          "..",
          supplier.logo.replace(/^\//, "")
        );
        // Xây dựng đường dẫn tuyệt đối tới file logo cũ: loại bỏ dấu "/" đầu và nối đường dẫn dự án
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
          // Nếu file cũ tồn tại, xóa file cũ để tránh rác
        }
      }

      // Save new logo
      const fileData = saveFile(req.file, "suppliers");
      // Gọi helper saveFile để lưu file mới
      logoUrl = fileData.url; // Cập nhật đường dẫn logo mới
    }

    // Cập nhật nhà cung cấp với các trường mới (nếu có)
    await supplier.update({
      name: name || supplier.name,
      // Nếu có name mới thì cập nhật, nếu không giữ nguyên
      code,
      // code đã được kiểm tra ở trên
      email: email !== undefined ? email : supplier.email,
      // Cập nhật email nếu truyền, ngược lại giữ nguyên
      phone: phone !== undefined ? phone : supplier.phone,
      // Tương tự cho phone
      address: address !== undefined ? address : supplier.address,
      // Tương tự cho address
      taxCode: taxCode !== undefined ? taxCode : supplier.taxCode,
      // Tương tự cho taxCode
      contactPerson:
        contactPerson !== undefined ? contactPerson : supplier.contactPerson,
      // Tương tự cho contactPerson
      website: website !== undefined ? website : supplier.website,
      // Tương tự cho website
      description:
        description !== undefined ? description : supplier.description,
      // Tương tự cho description
      status:
        status !== undefined
          ? status === "true" || status === true
          : supplier.status,
      // Nếu có truyền status, chuyển thành boolean, nếu không giữ nguyên
      logo: logoUrl,
      // Cập nhật đường dẫn logo (cũ hoặc mới)
    });

    res.json(supplier);
    // Trả về nhà cung cấp đã được cập nhật
  } catch (error) {
    console.error("Error updating supplier:", error); // In lỗi ra console
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: error.errors.map((e) => ({
          field: e.path, // Trường dữ liệu lỗi
          message: e.message, // Thông báo chi tiết
        })),
      });
      // Nếu lỗi validate, trả về danh sách lỗi với status 400
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
    // Các lỗi khác trả về status 500
  }
};

// Xóa nhà cung cấp
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id nhà cung cấp từ params URL

    const supplier = await Supplier.findByPk(id);
    // Tìm nhà cung cấp theo id
    if (!supplier) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
      // Nếu không tìm thấy, trả về lỗi 404
    }

    await supplier.destroy();
    // Xóa bản ghi nhà cung cấp (soft delete nếu mô hình có tính năng paranoid)

    return res.status(200).json({ message: "Xóa nhà cung cấp thành công" });
    // Trả về thông báo xóa thành công cùng status 200
  } catch (error) {
    console.error("Error deleting supplier:", error); // In lỗi ra console
    return res.status(500).json({ message: "Lỗi khi xóa nhà cung cấp" });
    // Trả về lỗi 500 nếu có exception
  }
};
