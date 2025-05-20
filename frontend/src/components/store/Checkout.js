import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState để quản lý state cục bộ (customerInfo, paymentMethod, v.v.)
// - useEffect để thực hiện các side-effects (tải dữ liệu, tính toán giá, điều hướng)

import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
  ListGroup,
} from "react-bootstrap";
// Import các component từ React Bootstrap để xây dựng giao diện:
// - Container, Row, Col: bố cục lưới
// - Form, Button: form và nút bấm
// - Card: khung chứa thông tin
// - Alert: hộp cảnh báo
// - Spinner: biểu tượng loading
// - ListGroup: danh sách nhóm mục

import { useNavigate } from "react-router-dom";
// Import hook useNavigate để điều hướng chương trình (programmatic navigation)

import { createOrder } from "../../services/api";
// Import hàm createOrder để gọi API tạo đơn hàng

import {
  FaCreditCard,
  FaMoneyBillWave,
  FaWallet,
  FaShippingFast,
} from "react-icons/fa";
// Import các icon từ thư viện react-icons/fa:
// - FaCreditCard: icon thẻ tín dụng
// - FaMoneyBillWave: icon tiền mặt
// - FaWallet: icon ví điện tử
// - FaShippingFast: icon phương thức vận chuyển

const Checkout = ({ cart = [], clearCart, isAuthenticated }) => {
  // Định nghĩa component Checkout, nhận prop:
  // - cart: mảng sản phẩm trong giỏ (mặc định [] nếu không truyền)
  // - clearCart: hàm xóa toàn bộ giỏ sau khi đặt hàng
  // - isAuthenticated: boolean cho biết user đã đăng nhập chưa

  const navigate = useNavigate();
  // Khởi tạo hook useNavigate để sau này thực hiện điều hướng

  // === State lưu thông tin form ===
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    note: "",
  });
  // customerInfo là object chứa thông tin khách: name, email, phone, address, city, note

  const [paymentMethod, setPaymentMethod] = useState("cod");
  // paymentMethod lưu phương thức thanh toán, mặc định "cod" (Thanh toán khi nhận hàng)

  const [shippingMethod, setShippingMethod] = useState("standard");
  // shippingMethod lưu phương thức vận chuyển, mặc định "standard"

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  // agreeToTerms lưu trạng thái checkbox đồng ý điều khoản

  // === UI states (trạng thái giao diện) ===
  const [loading, setLoading] = useState(false);
  // loading = true khi đang gọi API tạo đơn

  const [error, setError] = useState("");
  // error chứa thông báo lỗi (nếu có)

  const [success, setSuccess] = useState(false);
  // success = true nếu đơn hàng tạo thành công

  const [orderNumber, setOrderNumber] = useState("");
  // orderNumber lưu mã số đơn mới tạo

  // === Các số liệu tính toán giá ===
  const [subtotal, setSubtotal] = useState(0);
  // subtotal = tổng giá sản phẩm (chưa tính thuế, phí)

  const [shippingFee, setShippingFee] = useState(0);
  // shippingFee = phí vận chuyển

  const [tax, setTax] = useState(0);
  // tax = thuế (10% của subtotal)

  const [total, setTotal] = useState(0);
  // total = subtotal + shippingFee + tax

  // === Side effect: Nếu user đã đăng nhập, tải thông tin user từ localStorage ===
  useEffect(() => {
    if (isAuthenticated) {
      // Chỉ chạy nếu user đã đăng nhập
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          // Parse JSON user lưu trong localStorage
          setCustomerInfo((prev) => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
          }));
          // Cập nhật sẵn tên và email từ data user (nếu có)
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Nếu parse lỗi, in ra console và không làm gì thêm
        }
      }
    }
  }, [isAuthenticated]);
  // Dependency array chứa isAuthenticated, chỉ chạy khi giá trị này thay đổi

  // === Side effect: Điều hướng nếu chưa đăng nhập hoặc giỏ hàng trống ===
  useEffect(() => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, chuyển sang trang login, kèm query redirect=checkout
      navigate("/login?redirect=checkout");
      return;
    }

    if (cart.length === 0) {
      // Nếu giỏ hàng rỗng, chuyển về trang cart
      navigate("/cart");
    }
  }, [cart, isAuthenticated, navigate]);
  // Chạy mỗi khi cart hoặc isAuthenticated hoặc navigate thay đổi

  // === Side effect: Tính toán subtotal, shippingFee, tax, total mỗi khi cart hoặc shippingMethod thay đổi ===
  useEffect(() => {
    // Tính subtotal = tổng (price * quantity) của các item trong cart
    const newSubtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setSubtotal(newSubtotal);

    // Tính phí vận chuyển dựa vào shippingMethod và giá trị newSubtotal
    let newShippingFee = 0;
    if (shippingMethod === "standard") {
      newShippingFee = newSubtotal > 500000 ? 0 : 30000;
      // Miễn phí nếu subtotal > 500.000 VND, ngược lại 30.000 VND
    } else if (shippingMethod === "express") {
      newShippingFee = 50000;
      // Phí cố định 50.000 VND cho giao nhanh
    }
    setShippingFee(newShippingFee);

    // Tính thuế = 10% của subtotal
    const newTax = newSubtotal * 0.1;
    setTax(newTax);

    // Tính tổng = subtotal + shippingFee + tax
    setTotal(newSubtotal + newShippingFee + newTax);
  }, [cart, shippingMethod]);
  // Chạy mỗi khi cart hoặc shippingMethod thay đổi

  // === Hàm xử lý khi input form thay đổi ===
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Lấy name và value của field thay đổi
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Cập nhật field tương ứng trong customerInfo
  };

  // === Hàm định dạng tiền tệ (VND) ===
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
    // Sử dụng Intl.NumberFormat để format số thành định dạng VND
  };

  // === Xử lý submit form ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ngăn form reload trang

    if (!agreeToTerms) {
      // Nếu chưa check đồng ý điều khoản
      setError("Vui lòng đồng ý với điều khoản dịch vụ để tiếp tục.");
      return;
    }

    setLoading(true);
    setError("");
    // Bật loading, reset error

    try {
      // dữ liệu order trước khi đặt hàng
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerAddress: `${customerInfo.address}, ${customerInfo.city}`,
        notes: customerInfo.note,
        paymentMethod,
        shippingMethod,
        status: "pending",
        paymentStatus: paymentMethod === "cod" ? "unpaid" : "pending",
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          productCode: item.code,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        subtotal,
        tax,
        shipping: shippingFee,
        total,
      };

      // API tạo đơn hàng
      const response = await createOrder(orderData);

      // Nếu thành công, cập nhật state success và orderNumber
      setSuccess(true);
      setOrderNumber(response.data.order.orderNumber || response.data.order.id);

      // Xóa giỏ hàng sau khi tạo thành công
      clearCart();

      // Chuyển hướng sau 3 giây tới trang chi tiết đơn hàng
      setTimeout(() => {
        navigate(`/order/success?id=${response.data.order.id}`);
      }, 3000);
    } catch (error) {
      console.error("Error creating order:", error);
      // Nếu API trả về lỗi, cập nhật error message
      setError(
        error.response?.data?.message ||
          "Không thể tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
      // Tắt loading dù thành công hay thất bại
    }
  };

  // === Nếu đặt hàng thành công, hiển thị message success ===
  if (success) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="success" className="text-center">
              <h4>Đặt hàng thành công!</h4>
              <p>
                Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là:{" "}
                <strong>{orderNumber}</strong>
              </p>
              <p>Đang chuyển hướng đến trang chi tiết đơn hàng...</p>
              <Spinner animation="border" variant="success" />
              {/* Spinner loading nhỏ để báo đang chuyển hướng */}
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Thanh toán</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {/* Nếu có error, hiển thị Alert màu đỏ chứa message */}

      <Form onSubmit={handleSubmit}>
        {/* Bắt sự kiện onSubmit khi bấm nút Đặt hàng */}

        <Row>
          <Col md={8}>
            {/* Column bên trái chứa form thông tin giao hàng, vận chuyển, thanh toán */}

            <Card className="mb-4">
              <Card.Header as="h5">Thông tin giao hàng</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    {/* Họ tên (bắt buộc) */}
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Họ tên <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={customerInfo.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập họ tên người nhận"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Số điện thoại (bắt buộc) */}
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Số điện thoại <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    {/* Email (không bắt buộc) */}
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={customerInfo.email}
                        onChange={handleInputChange}
                        placeholder="Nhập email"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Tỉnh/Thành phố (bắt buộc) */}
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Tỉnh/Thành phố <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={customerInfo.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập tỉnh/thành phố"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Địa chỉ chi tiết (bắt buộc) */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Địa chỉ <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                </Form.Group>

                {/* Ghi chú (không bắt buộc) */}
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="note"
                    value={customerInfo.note}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header as="h5">Phương thức vận chuyển</Card.Header>
              <Card.Body>
                <Form.Group>
                  <div className="mb-3">
                    {/* Radio cho Giao hàng tiêu chuẩn */}
                    <Form.Check
                      type="radio"
                      id="shipping-standard"
                      name="shippingMethod"
                      label={
                        <div>
                          <FaShippingFast className="me-2" />
                          <strong>Giao hàng tiêu chuẩn</strong>
                          <div className="text-muted small">
                            (Giao hàng trong 3-5 ngày, miễn phí cho đơn hàng
                            trên 500.000đ)
                          </div>
                        </div>
                      }
                      value="standard"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                      className="mb-2"
                    />

                    {/* Radio cho Giao hàng nhanh */}
                    <Form.Check
                      type="radio"
                      id="shipping-express"
                      name="shippingMethod"
                      label={
                        <div>
                          <FaShippingFast className="me-2" />
                          <strong>Giao hàng nhanh</strong>
                          <div className="text-muted small">
                            (Giao hàng trong 1-2 ngày)
                          </div>
                        </div>
                      }
                      value="express"
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                    />
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header as="h5">Phương thức thanh toán</Card.Header>
              <Card.Body>
                <Form.Group>
                  <div className="mb-3">
                    {/* Radio COD */}
                    <Form.Check
                      type="radio"
                      id="payment-cod"
                      name="paymentMethod"
                      label={
                        <div>
                          <FaMoneyBillWave className="me-2" />
                          <strong>Thanh toán khi nhận hàng (COD)</strong>
                        </div>
                      }
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mb-2"
                    />

                    {/* Radio Chuyển khoản ngân hàng */}
                    <Form.Check
                      type="radio"
                      id="payment-bank"
                      name="paymentMethod"
                      label={
                        <div>
                          <FaCreditCard className="me-2" />
                          <strong>Chuyển khoản ngân hàng</strong>
                        </div>
                      }
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                      className="mb-2"
                    />

                    {/* Radio Ví điện tử */}
                    <Form.Check
                      type="radio"
                      id="payment-wallet"
                      name="paymentMethod"
                      label={
                        <div>
                          <FaWallet className="me-2" />
                          <strong>Ví điện tử (MoMo, ZaloPay)</strong>
                        </div>
                      }
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                    />
                  </div>
                </Form.Group>

                {paymentMethod === "bank" && (
                  // Hiển thị thông tin chuyển khoản nếu chọn paymentMethod là bank
                  <Alert variant="info">
                    <p className="mb-1">
                      Vui lòng chuyển khoản theo thông tin:
                    </p>
                    <p className="mb-1">
                      Ngân hàng: <strong>Ngân hàng ABC</strong>
                    </p>
                    <p className="mb-1">
                      Số tài khoản: <strong>12345678901234</strong>
                    </p>
                    <p className="mb-1">
                      Chủ tài khoản: <strong>CÔNG TY ABC</strong>
                    </p>
                    <p className="mb-0">
                      Nội dung: <strong>Thanh toán đơn hàng [Họ tên]</strong>
                    </p>
                  </Alert>
                )}

                {paymentMethod === "wallet" && (
                  // Hiển thị giải thích nếu chọn ví điện tử
                  <Alert variant="info">
                    <p className="mb-0">
                      Bạn sẽ được chuyển đến trang thanh toán sau khi đặt hàng
                    </p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* === Cột phải: Hiển thị tóm tắt đơn hàng và nút đặt hàng === */}
          <Col md={4}>
            <Card className="mb-4">
              <Card.Header as="h5">Đơn hàng của bạn</Card.Header>
              <ListGroup variant="flush">
                {cart.map((item) => (
                  <ListGroup.Item
                    key={item.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div>
                        <span className="fw-bold">{item.name}</span>
                        <span className="text-primary ms-1">
                          × {item.quantity}
                        </span>
                      </div>
                      <small className="text-muted">{item.code}</small>
                    </div>
                    <div className="text-end">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Card.Body>
                {/* Tạm tính (subtotal) */}
                <div className="d-flex justify-content-between mb-2">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {/* Phí vận chuyển */}
                <div className="d-flex justify-content-between mb-2">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}
                  </span>
                </div>
                {/* Thuế (10%) */}
                <div className="d-flex justify-content-between mb-3">
                  <span>Thuế (10%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <hr />
                {/* Tổng cộng: subtotal + shippingFee + tax */}
                <div className="d-flex justify-content-between mb-3 fw-bold">
                  <span>Tổng cộng:</span>
                  <span className="h5 text-primary mb-0">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Checkbox đồng ý điều khoản (bắt buộc) */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="terms"
                    label="Tôi đã đọc và đồng ý với điều khoản dịch vụ"
                    checked={agreeToTerms}
                    onChange={() => setAgreeToTerms(!agreeToTerms)}
                    required
                  />
                </Form.Group>

                {/* Nút Đặt hàng */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  size="lg"
                  disabled={loading || !agreeToTerms}
                  // Disable khi đang loading hoặc chưa đồng ý điều khoản
                >
                  {loading ? (
                    <>
                      {/* Spinner bên trong nút khi loading = true */}
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Đang xử lý...
                    </>
                  ) : (
                    "Đặt hàng"
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default Checkout;
