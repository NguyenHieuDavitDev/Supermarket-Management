import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState để quản lý state cục bộ trong component
// - useEffect để thực hiện side effects (tính toán, cập nhật state khi props thay đổi)

import {
  Container,
  Table,
  Button,
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Alert,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container, Row, Col cho layout lưới
// - Table để hiển thị bảng
// - Button để hiển thị nút bấm
// - Card để hiển thị khung tóm tắt
// - Form, InputGroup cho form điều chỉnh số lượng
// - Alert để hiển thị cảnh báo

import { Link, useNavigate } from "react-router-dom";
// Import Link để điều hướng nội bộ (client-side routing)
// Import useNavigate để chuyển programmatically sang trang khác

import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaArrowLeft,
  FaShoppingCart,
} from "react-icons/fa";
// Import các icon từ react-icons/fa:
// - FaTrash: biểu tượng thùng rác (xóa item)
// - FaMinus / FaPlus: biểu tượng trừ / cộng (giảm / tăng số lượng)
// - FaArrowLeft: biểu tượng mũi tên về trái (quay lại trang sản phẩm)
// - FaShoppingCart: biểu tượng giỏ hàng

const Cart = ({
  cart = [],
  updateCartItem,
  removeCartItem,
  clearCart,
  isAuthenticated,
}) => {
  // Khai báo component Cart, nhận các prop:
  // - cart: mảng các item trong giỏ (mặc định = [])
  // - updateCartItem: hàm để cập nhật số lượng của một item
  // - removeCartItem: hàm để xóa một item khỏi giỏ
  // - clearCart: hàm để xóa toàn bộ giỏ
  // - isAuthenticated: boolean cho biết người dùng đã đăng nhập chưa

  const [total, setTotal] = useState(0);
  // State lưu tổng tiền tạm tính (chưa tính thuế, phí) của giỏ

  const [quantity, setQuantity] = useState({});
  // State lưu số lượng tạm của mỗi item khi người dùng chỉnh trong ô input.
  // Dạng object: { [itemId]: số lượng mới }

  const navigate = useNavigate();
  // useNavigate trả về hàm navigate để chuyển trang programmatically

  useEffect(() => {
    // Side effect chạy mỗi khi mảng cart thay đổi

    // 1. Tính lại tổng tiền tạm (sum price * quantity)
    const newTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotal(newTotal);
    // Cập nhật state total

    // 2. Khởi tạo state quantity từ giá trị thực tế của cart
    const quantityMap = {};
    cart.forEach((item) => {
      quantityMap[item.id] = item.quantity;
    });
    setQuantity(quantityMap);
    // Cập nhật state quantity thành { itemId: item.quantity } để hiển thị trong input
  }, [cart]);
  // Chỉ chạy effect khi cart thay đổi

  // Hàm xử lý khi giá trị input số lượng thay đổi (chưa cập nhật lên cart)
  const handleQuantityChange = (itemId, value) => {
    setQuantity((prev) => ({
      ...prev,
      [itemId]: value,
    }));
    // Cập nhật state quantity với giá trị mới cho itemId
  };

  // Hàm gọi khi cần cập nhật số lượng thật lên cart (gọi prop updateCartItem)
  const handleUpdateQuantity = (item, newQuantity) => {
    if (newQuantity < 1) newQuantity = 1;
    // Bảo đảm số lượng tối thiểu là 1

    if (newQuantity > item.availableQuantity) {
      newQuantity = item.availableQuantity;
    }
    // Không cho vượt quá số tồn kho (availableQuantity)

    updateCartItem(item.id, newQuantity);
    // Gọi prop để cập nhật cart (thực tế lưu vào store hoặc context)
  };

  // Hàm định dạng số thành định dạng tiền VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
    // Sử dụng Intl.NumberFormat để định dạng VND
  };

  // Hàm xử lý khi nhấn nút Thanh toán
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, chuyển đến trang login, giữ param redirect
      navigate("/store/login?redirect=checkout");
    } else {
      // Nếu đã đăng nhập, chuyển đến trang checkout
      navigate("/store/checkout");
    }
  };

  // Nếu người dùng chưa đăng nhập, hiện cảnh báo kêu đăng nhập
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          Vui lòng <Link to="/store/login?redirect=cart">đăng nhập</Link> để xem
          giỏ hàng của bạn.
        </Alert>
      </Container>
    );
  }

  // Nếu giỏ hàng trống, hiển thị thông báo trống giỏ và nút tiếp tục mua sắm
  if (cart.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center my-5">
          <FaShoppingCart size={50} className="text-muted mb-3" />
          {/* Hiển thị icon giỏ hàng màu xám */}
          <h3>Giỏ hàng của bạn đang trống</h3>
          <p className="text-muted">
            Hãy thêm sản phẩm vào giỏ hàng để tiến hành mua sắm
          </p>
          <Button
            as={Link}
            to="/store/products"
            variant="primary"
            className="mt-3"
          >
            Tiếp tục mua sắm
          </Button>
          {/* Nút dẫn về trang sản phẩm */}
        </div>
      </Container>
    );
  }

  // Nếu đã có item trong cart, hiển thị bảng giỏ hàng và tóm tắt
  return (
    <Container className="py-5">
      <h1 className="mb-4">Giỏ hàng của bạn</h1>

      <Row>
        {/* Cột trái: danh sách sản phẩm trong giỏ */}
        <Col lg={8}>
          <Table responsive className="cart-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Sản phẩm</th>
                <th style={{ width: "15%" }}>Giá</th>
                <th style={{ width: "20%" }}>Số lượng</th>
                <th style={{ width: "15%" }}>Tổng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={
                          item.image ||
                          `https://via.placeholder.com/80x80?text=${item.name}`
                        }
                        // Nếu item.image tồn tại, lấy URL đó; nếu không, sử dụng placeholder chứa tên sản phẩm
                        alt={item.name}
                        className="cart-item-image me-3"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <h6 className="mb-0">{item.name}</h6>
                        <small className="text-muted">Mã: {item.code}</small>
                        {/* Hiển thị mã sản phẩm dưới tên */}
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  {/* Hiển thị giá sau khi format VND */}

                  <td>
                    <InputGroup size="sm">
                      {/* Nút giảm số lượng */}
                      <Button
                        variant="outline-secondary"
                        onClick={() =>
                          handleUpdateQuantity(item, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        // Disable khi quantity <= 1
                      >
                        <FaMinus />
                      </Button>

                      {/* Input cho phép nhập số lượng trực tiếp */}
                      <Form.Control
                        type="number"
                        min="1"
                        max={item.availableQuantity}
                        value={quantity[item.id] || item.quantity}
                        // Giá trị input lấy từ state quantity[item.id], nếu undefined lấy from item.quantity
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        // Khi nhập thay đổi, gọi handleQuantityChange cập nhật state quantity
                        onBlur={() =>
                          handleUpdateQuantity(item, quantity[item.id])
                        }
                        // Khi mất focus (onBlur), gọi cập nhật thực sự lên cart
                        className="text-center"
                      />

                      {/* Nút tăng số lượng */}
                      <Button
                        variant="outline-secondary"
                        onClick={() =>
                          handleUpdateQuantity(item, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.availableQuantity}
                        // Disable khi đã đạt max = availableQuantity
                      >
                        <FaPlus />
                      </Button>
                    </InputGroup>

                    {/* Nếu số tồn kho còn ít (dưới 10), hiển thị cảnh báo */}
                    {item.availableQuantity < 10 && (
                      <small className="text-danger d-block mt-1">
                        Chỉ còn {item.availableQuantity} sản phẩm
                      </small>
                    )}
                  </td>

                  {/* Tổng tiền của item = price * quantity */}
                  <td className="fw-bold">
                    {formatCurrency(item.price * item.quantity)}
                  </td>

                  {/* Nút xóa item khỏi giỏ */}
                  <td>
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => removeCartItem(item.id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Nút thao tác dưới bảng: quay lại mua sắm và xóa toàn bộ giỏ */}
          <div className="d-flex justify-content-between mt-4">
            <Button as={Link} to="/store/products" variant="outline-secondary">
              <FaArrowLeft className="me-2" /> Tiếp tục mua sắm
            </Button>
            <Button variant="outline-danger" onClick={clearCart}>
              <FaTrash className="me-2" /> Xóa giỏ hàng
            </Button>
          </div>
        </Col>

        {/* Cột phải: Tóm tắt đơn hàng và ghi chú */}
        <Col lg={4} className="mt-4 mt-lg-0">
          <Card>
            <Card.Header as="h5">Tóm tắt đơn hàng</Card.Header>
            <Card.Body>
              {/* Hiển thị tạm tính (subtotal) */}
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính:</span>
                <span>{formatCurrency(total)}</span>
              </div>

              {/* Phí vận chuyển */}
              <div className="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>

              {/* Tính thuế 10% */}
              <div className="d-flex justify-content-between mb-3">
                <span>Thuế (10%):</span>
                <span>{formatCurrency(total * 0.1)}</span>
              </div>

              <hr />

              {/* Tổng cộng = subtotal + tax */}
              <div className="d-flex justify-content-between mb-3 fw-bold">
                <span>Tổng cộng:</span>
                <span>{formatCurrency(total * 1.1)}</span>
              </div>

              {/* Nút tiến hành thanh toán */}
              <Button
                variant="primary"
                className="w-100"
                onClick={handleCheckout}
              >
                Tiến hành thanh toán
              </Button>
            </Card.Body>
          </Card>

          {/* Card cho phần ghi chú (tùy chọn) */}
          <Card className="mt-3">
            <Card.Body>
              <h6>Ghi chú</h6>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Ghi chú về đơn hàng (tùy chọn)"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
// Xuất component Cart để sử dụng ở nơi khác trong ứng dụng
