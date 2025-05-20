const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/uploadMiddleware");
const productController = require("../controllers/productController");

// Lấy danh sách sản phẩm (có phân trang, tìm kiếm, sắp xếp)
router.get("/", productController.getProducts);

// Xem chi tiết sản phẩm
router.get("/:id", productController.getProductById);

// Tạo sản phẩm mới (với upload nhiều hình ảnh)
router.post("/", upload.array("images", 10), productController.createProduct);

// Cập nhật thông tin sản phẩm
router.put("/:id", upload.array("images", 10), productController.updateProduct);

// Xóa mềm sản phẩm
router.delete("/:id", productController.deleteProduct);

// Khôi phục sản phẩm đã xóa mềm
router.patch("/:id/restore", productController.restoreProduct);

module.exports = router;
