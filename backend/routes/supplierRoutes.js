const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");

// Lấy danh sách nhà cung cấp (có phân trang và tìm kiếm)
router.get("/", supplierController.getSuppliers);

// Lấy thông tin nhà cung cấp theo ID
router.get("/:id", supplierController.getSupplierById);

// Tạo nhà cung cấp mới
router.post(
  "/",
  supplierController.uploadLogo,
  supplierController.createSupplier
);

// Cập nhật nhà cung cấp
router.put(
  "/:id",
  supplierController.uploadLogo,
  supplierController.updateSupplier
);

// Xóa nhà cung cấp
router.delete("/:id", supplierController.deleteSupplier);

module.exports = router;
