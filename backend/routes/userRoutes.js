const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Lấy danh sách người dùng
router.get("/", userController.getUsers);
// Lấy chi tiết 1 người dùng
router.get("/:id", userController.getUserById);
// Thêm mới người dùng (upload ảnh)
router.post("/", userController.uploadAvatar, userController.createUser);
// Cập nhật người dùng
router.put("/:id", userController.uploadAvatar, userController.updateUser);
// Xóa (soft delete) người dùng
router.delete("/:id", userController.deleteUser);

module.exports = router;
