const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Lấy tất cả danh mục
router.get("/", categoryController.getAllCategories);

// Lấy danh mục theo ID
router.get("/:id", categoryController.getCategoryById);

// Tạo danh mục mới
router.post(
  "/",
  categoryController.uploadCategoryImage,
  categoryController.createCategory
);

// Cập nhật danh mục
router.put(
  "/:id",
  categoryController.uploadCategoryImage,
  categoryController.updateCategory
);

// Xóa danh mục
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
