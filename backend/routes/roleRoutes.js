const express = require("express");
// Import Express để tạo router

const router = express.Router();
// Khởi tạo một instance của Router để định nghĩa các route liên quan đến vai trò

const roleController = require("../controllers/roleController");
// Import module controller xử lý logic cho các route về vai trò (role)

// Định nghĩa route: GET /roles
// Khi có request GET tới '/', gọi hàm getAllRoles để lấy danh sách tất cả vai trò
router.get("/", roleController.getAllRoles);

// Định nghĩa route: POST /roles
// Khi có request POST tới '/', gọi hàm createRole để thêm mới một vai trò
router.post("/", roleController.createRole);

// Định nghĩa route: PUT /roles/:id
// Khi có request PUT tới '/:id', gọi hàm updateRole để cập nhật vai trò theo ID
// :id sẽ được truyền vào req.params.id trong controller
router.put("/:id", roleController.updateRole);

// Định nghĩa route: DELETE /roles/:id
// Khi có request DELETE tới '/:id', gọi hàm deleteRole để xóa vai trò theo ID
// :id sẽ được truyền vào req.params.id trong controller
router.delete("/:id", roleController.deleteRole);

module.exports = router;
// Xuất router để sử dụng trong file chính, ví dụ: app.use("/roles", router)
