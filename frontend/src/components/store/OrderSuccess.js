import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState: để quản lý state cục bộ (order, loading, error)
// - useEffect: để thực hiện side effect (gọi API khi component mount)

import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
  Button,
  ListGroup,
  Badge,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container: khung chứa chính với padding mặc định
// - Row, Col: bố cục lưới để chia cột
// - Card: khung hiển thị thông tin (Chi tiết đơn, Thông tin giao hàng, Sản phẩm đã đặt)
// - Alert: hiển thị thông báo lỗi hoặc thành công
// - Spinner: biểu tượng loading khi chờ API
// - Button: các nút bấm
// - ListGroup: danh sách liệt kê các phần tử (dùng hiển thị các OrderItem)
// - Badge: hiển thị nhãn trạng thái (status, payment status)

import { useNavigate, useLocation } from "react-router-dom";
// Import hai hook từ React Router:
// - useNavigate: điều hướng lập trình (programmatically) đến đường dẫn khác
// - useLocation: lấy đối tượng location (để đọc query string)

import { getOrderById } from "../../services/api";
// Import hàm gọi API getOrderById để lấy thông tin đơn hàng theo id

import {
  FaArrowLeft,
  FaFileInvoice,
  FaShippingFast,
  FaCheckCircle,
} from "react-icons/fa";
// Import các icon từ react-icons/fa:
// - FaArrowLeft: icon mũi tên quay lại
// - FaFileInvoice: icon hóa đơn (dùng trong header Chi tiết đơn hàng)
// - FaShippingFast: icon giao hàng (dùng trong header Thông tin giao hàng)
// - FaCheckCircle: icon dấu tích (dùng hiển thị thông báo “Đặt hàng thành công”)

const OrderSuccess = ({ isAuthenticated }) => {
  // Định nghĩa component OrderSuccess, nhận prop:
  // - isAuthenticated: boolean cho biết user đã đăng nhập chưa

  const navigate = useNavigate();
  // Khởi tạo hook useNavigate để có thể điều hướng động

  const location = useLocation();
  // Khởi tạo hook useLocation để đọc query string và path hiện tại

  const orderId = new URLSearchParams(location.search).get("id");
  // Lấy giá trị param “id” từ query string, ví dụ ?id=123

  // === Khai báo các biến state ===
  const [order, setOrder] = useState(null);
  // State lưu đối tượng order (thông tin đơn hàng) sau khi fetch từ API

  const [loading, setLoading] = useState(true);
  // State boolean cho biết đang loading (chờ kết quả API)

  const [error, setError] = useState("");
  // State lưu thông báo lỗi nếu có lỗi khi fetch

  // === useEffect: chạy khi component mount hoặc khi orderId/isAuthenticated thay đổi ===
  useEffect(() => {
    if (!isAuthenticated) {
      // Nếu user chưa đăng nhập
      navigate("/login?redirect=orders");
      // Điều hướng tới trang login và kèm param redirect=orders để sau khi login quay về
      return;
    }

    if (!orderId) {
      // Nếu không có orderId trong URL
      navigate("/");
      // Điều hướng về trang chủ
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Bật loading trước khi gọi API

        const response = await getOrderById(orderId);
        // Gọi API getOrderById với orderId lấy từ URL

        setOrder(response.data.order);
        // Cập nhật state order với dữ liệu trả về từ API
      } catch (error) {
        console.error("Error fetching order:", error);
        // In lỗi ra console để debug

        setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
        // Cập nhật thông báo lỗi cho người dùng
      } finally {
        setLoading(false);
        // Tắt loading dù thành công hay lỗi
      }
    };

    fetchOrder();
    // Gọi hàm fetchOrder khi useEffect được kích hoạt
  }, [orderId, isAuthenticated, navigate]);
  // Dependency array: chạy lại khi orderId, isAuthenticated, hoặc navigate thay đổi

  // === Hàm formatCurrency: định dạng số thành tiền VND ===
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
    // Sử dụng Intl.NumberFormat để chuyển 1000000 -> "1.000.000 ₫"
  };

  // === Hàm getStatusBadge: trả về Badge tương ứng với status đơn hàng ===
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Chờ xử lý</Badge>;
      case "processing":
        return <Badge bg="primary">Đang xử lý</Badge>;
      case "shipped":
        return <Badge bg="info">Đang giao hàng</Badge>;
      case "delivered":
        return <Badge bg="success">Đã giao hàng</Badge>;
      case "cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // === Hàm getPaymentStatusBadge: trả về Badge cho trạng thái thanh toán ===
  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge bg="success">Đã thanh toán</Badge>;
      case "pending":
        return <Badge bg="warning">Chờ thanh toán</Badge>;
      case "unpaid":
        return <Badge bg="danger">Chưa thanh toán</Badge>;
      default:
        return <Badge bg="secondary">{paymentStatus}</Badge>;
    }
  };

  // === Hàm getPaymentMethod: chuyển code phương thức thanh toán thành chuỗi dễ đọc ===
  const getPaymentMethod = (method) => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng (COD)";
      case "bank":
        return "Chuyển khoản ngân hàng";
      case "wallet":
        return "Ví điện tử";
      default:
        return method;
    }
  };

  // === Hàm getShippingMethod: chuyển code phương thức vận chuyển thành chuỗi dễ đọc ===
  const getShippingMethod = (method) => {
    switch (method) {
      case "standard":
        return "Giao hàng tiêu chuẩn (3-5 ngày)";
      case "express":
        return "Giao hàng nhanh (1-2 ngày)";
      default:
        return method;
    }
  };

  // === Phần render logic ===
  if (loading) {
    // Nếu đang loading (chờ kết quả API)
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        {/* Hiển thị spinner ở giữa */}
        <p className="mt-3">Đang tải thông tin đơn hàng...</p>
      </Container>
    );
  }

  if (error) {
    // Nếu có lỗi (error không rỗng)
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        {/* Hiển thị thông báo lỗi */}
        <Button variant="outline-primary" onClick={() => navigate("/")}>
          {/* Nút quay lại trang chủ */}
          <FaArrowLeft className="me-2" />
          Quay lại Trang chủ
        </Button>
      </Container>
    );
  }

  if (!order) {
    // Nếu không có order (sau khi loading xong nhưng order vẫn null)
    return (
      <Container className="py-5">
        <Alert variant="warning">Không tìm thấy thông tin đơn hàng.</Alert>
        {/* Hiển thị cảnh báo không tìm thấy */}
        <Button variant="outline-primary" onClick={() => navigate("/")}>
          <FaArrowLeft className="me-2" />
          Quay lại Trang chủ
        </Button>
      </Container>
    );
  }

  // Nếu đến được đây tức là order đã tồn tại và không lỗi
  return (
    <Container className="py-5">
      {/* Thông báo thành công đặt hàng */}
      <Row className="mb-4">
        <Col>
          <Alert variant="success" className="d-flex align-items-center">
            <FaCheckCircle size={24} className="me-3" />
            {/* Icon dấu tích */}
            <div>
              <h4 className="mb-1">Đặt hàng thành công!</h4>
              <p className="mb-0">
                Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận và
                đang được xử lý.
              </p>
            </div>
          </Alert>
        </Col>
      </Row>

      {/* Phần Chi tiết đơn hàng và Thông tin giao hàng */}
      <Row className="mb-4">
        <Col md={8}>
          {/* Card chứa Chi tiết đơn hàng */}
          <Card className="mb-4">
            <Card.Header
              as="h5"
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <FaFileInvoice className="me-2" />
                {/* Icon hóa đơn */}
                Chi tiết đơn hàng #{order.orderNumber}
              </div>
              {getStatusBadge(order.status)}
              {/* Hiển thị badge trạng thái đơn */}
            </Card.Header>
            <Card.Body>
              {/* Dòng hiển thị Ngày đặt và Trạng thái thanh toán */}
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Ngày đặt hàng:</strong>
                  </p>
                  <p>{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Trạng thái thanh toán:</strong>
                  </p>
                  <p>{getPaymentStatusBadge(order.paymentStatus)}</p>
                </Col>
              </Row>

              {/* Dòng hiển thị Phương thức thanh toán và Phương thức vận chuyển */}
              <Row>
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Phương thức thanh toán:</strong>
                  </p>
                  <p>{getPaymentMethod(order.paymentMethod)}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Phương thức vận chuyển:</strong>
                  </p>
                  <p>{getShippingMethod(order.shippingMethod)}</p>
                </Col>
              </Row>

              {/* Nếu có ghi chú, hiển thị mục Ghi chú */}
              {order.notes && (
                <div className="mt-3">
                  <p className="mb-1">
                    <strong>Ghi chú:</strong>
                  </p>
                  <p>{order.notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Card chứa Thông tin giao hàng */}
          <Card className="mb-4">
            <Card.Header as="h5">
              <FaShippingFast className="me-2" />
              {/* Icon giao hàng */}
              Thông tin giao hàng
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <strong>Người nhận:</strong> {order.customerName}
              </p>
              <p className="mb-1">
                <strong>Địa chỉ:</strong> {order.customerAddress}
              </p>
              <p className="mb-1">
                <strong>Số điện thoại:</strong> {order.customerPhone}
              </p>
              {order.customerEmail && (
                // Nếu có email, hiển thị mục Email
                <p className="mb-0">
                  <strong>Email:</strong> {order.customerEmail}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Card chứa danh sách sản phẩm đã đặt và tổng tiền */}
          <Card>
            <Card.Header as="h5">Sản phẩm đã đặt</Card.Header>
            <ListGroup variant="flush">
              {order.OrderItems?.map((item) => (
                // Lặp qua mảng OrderItems (chi tiết từng sản phẩm)
                <ListGroup.Item
                  key={item.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div>
                      <span className="fw-bold">{item.productName}</span>
                      <span className="text-primary ms-1">
                        × {item.quantity}
                      </span>
                    </div>
                    <small className="text-muted">{item.productCode}</small>
                  </div>
                  <div className="text-end">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Card.Body>
              {/* Tóm tắt tạm tính, phí vận chuyển, thuế và tổng cộng */}
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển:</span>
                <span>
                  {order.shipping > 0
                    ? formatCurrency(order.shipping)
                    : "Miễn phí"}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Thuế (10%):</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3 fw-bold">
                <span>Tổng cộng:</span>
                <span className="h5 text-primary mb-0">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Nút điều hướng cuối trang: Tiếp tục mua sắm và Xem lịch sử đơn hàng */}
      <Row>
        <Col className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => navigate("/")}>
            <FaArrowLeft className="me-2" />
            Tiếp tục mua sắm
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => navigate("/orders")}
          >
            Lịch sử đơn hàng
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderSuccess;
