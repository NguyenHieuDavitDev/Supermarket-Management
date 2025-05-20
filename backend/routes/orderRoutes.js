const express = require("express");
// Import Express để tạo router

const router = express.Router();
// Khởi tạo một instance của Router để định nghĩa các route liên quan đến đơn hàng

const orderController = require("../controllers/orderController");
// Import module controller xử lý logic cho các route liên quan đến đơn hàng

const { authMiddleware } = require("../middleware/authMiddleware");
// Import middleware xác thực (kiểm tra JWT token) để bảo vệ các route

// Áp dụng authMiddleware cho tất cả các route bên dưới
router.use(authMiddleware);
// Khi truy cập bất kỳ route nào, trước hết sẽ chạy authMiddleware để kiểm tra user đã đăng nhập hay chưa

// Lấy danh sách tất cả đơn hàng, hỗ trợ lọc, tìm kiếm và phân trang
router.get("/", orderController.getOrders);
// Khi client gửi GET /orders, gọi hàm getOrders trong orderController để trả về danh sách đơn hàng

// Tìm kiếm đơn hàng (autocomplete suggestion)
router.get("/search", orderController.searchOrders);
// Khi client gửi GET /orders/search?query=..., gọi hàm searchOrders để trả về gợi ý tìm kiếm đơn hàng

// Lấy thông tin chi tiết một đơn hàng theo ID
router.get("/:id", orderController.getOrderById);
// Khi client gửi GET /orders/:id, gọi getOrderById (vd: GET /orders/123) để lấy chi tiết đơn hàng có id = 123

// Tạo đơn hàng mới
router.post("/", orderController.createOrder);
// Khi client gửi POST /orders với payload chứa thông tin đơn hàng, gọi createOrder để tạo mới

// Cập nhật thông tin đơn hàng theo ID
router.put("/:id", orderController.updateOrder);
// Khi client gửi PUT /orders/:id với payload mới, gọi updateOrder để cập nhật đơn hàng có id tương ứng

// Xóa mềm một đơn hàng (soft delete)
router.delete("/:id", orderController.deleteOrder);
// Khi client gửi DELETE /orders/:id, gọi deleteOrder để đánh dấu xóa mềm (đặt deletedAt)

// Khôi phục đơn hàng đã xóa mềm
router.patch("/:id/restore", orderController.restoreOrder);
// Khi client gửi PATCH /orders/:id/restore, gọi restoreOrder để xóa dấu deletedAt (khôi phục)

// Cập nhật trạng thái đơn hàng (status)
router.patch("/:id/status", orderController.updateOrderStatus);
// Khi client gửi PATCH /orders/:id/status với body { status: "..." }, gọi updateOrderStatus

// Cập nhật trạng thái thanh toán đơn hàng (paymentStatus)
router.patch("/:id/payment", orderController.updatePaymentStatus);
// Khi client gửi PATCH /orders/:id/payment với body { paymentStatus: "..." }, gọi updatePaymentStatus

module.exports = router;
// Xuất router để sử dụng ở app chính (vd: app.use("/orders", router))
