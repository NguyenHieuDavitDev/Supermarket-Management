const multer = require("multer");
// Import thư viện multer để xử lý upload file

const path = require("path");
// Import path để thao tác với đường dẫn và phần mở rộng file

// --- Cấu hình storage cho multer để lưu file upload ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Hàm destination định nghĩa thư mục lưu file dựa trên loại fieldname và route

    let uploadDir = "uploads/";
    // Mặc định thư mục gốc là "uploads/"

    if (file.fieldname === "images" || file.fieldname === "image") {
      // Nếu fieldname của file là "images" hoặc "image" (dùng cho sản phẩm, danh mục, nhà cung cấp)

      if (req.baseUrl.includes("/products")) {
        // Nếu route chứa "/products", lưu vào thư mục uploads/products/
        uploadDir = "uploads/products/";
      } else if (req.baseUrl.includes("/categories")) {
        // Nếu route chứa "/categories", lưu vào uploads/categories/
        uploadDir = "uploads/categories/";
      } else if (req.baseUrl.includes("/suppliers")) {
        // Nếu route chứa "/suppliers", lưu vào uploads/suppliers/
        uploadDir = "uploads/suppliers/";
      }
    }

    cb(null, uploadDir);
    // Gọi callback với lỗi null và đường dẫn uploadDir đã xác định
  },
  filename: function (req, file, cb) {
    // Hàm filename tạo tên file duy nhất để tránh trùng lặp

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Tạo chuỗi ngẫu nhiên gồm timestamp + random số để làm suffix

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
    // Đặt tên file = <fieldname>-<uniqueSuffix> + phần mở rộng gốc
    // Ví dụ: "image-1689000000000-123456789.jpg"
  },
});

// --- Giới hạn loại file và dung lượng upload ---
const fileFilter = (req, file, cb) => {
  // Hàm fileFilter kiểm tra mime-type và phần mở rộng

  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  // Định nghĩa biểu thức chính quy cho các định dạng ảnh cho phép

  const mimetype = allowedTypes.test(file.mimetype);
  // Kiểm tra mime-type của file có khớp trong allowedTypes không

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  // Kiểm tra phần mở rộng (lowercase) của originalname có khớp không

  if (mimetype && extname) {
    return cb(null, true);
    // Nếu cả mime-type và extname đều hợp lệ, cho phép tiếp tục upload
  } else {
    cb(
      new Error("Chỉ chấp nhận file hình ảnh (jpg, jpeg, png, gif, webp, svg)")
    );
    // Nếu không hợp lệ, gọi callback với Error thông báo
  }
};

// --- Khởi tạo middleware upload từ multer ---
const upload = multer({
  storage: storage,
  // Sử dụng cấu hình storage đã định nghĩa ở trên

  limits: {
    fileSize: 10 * 1024 * 1024,
    // Giới hạn dung lượng file tối đa 10MB
  },

  fileFilter: fileFilter,
  // Sử dụng fileFilter để kiểm tra loại file trước khi lưu
});

module.exports = {
  upload,
  // Xuất ra middleware upload để sử dụng trong các route
};
