import React, { useState } from "react";
// Import React và hook useState để quản lý state cục bộ trong component

import {
  Container,
  Row,
  Col,
  ListGroup,
  InputGroup,
  Form,
  Button,
  Toast,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container, Row, Col: bố cục dạng lưới
// - ListGroup: danh sách nhóm mục (dùng cho các liên kết)
// - InputGroup: nhóm input + button (dùng cho form đăng ký nhận tin)
// - Form: form xử lý nhập liệu
// - Button: nút bấm
// - Toast: thông báo pop-up

import { Link } from "react-router-dom";
// Import Link để điều hướng nội bộ (client-side routing)

import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaHeart,
  FaCreditCard,
  FaTruck,
  FaShieldAlt,
} from "react-icons/fa";
// Import các icon từ thư viện react-icons/fa:
// - FaFacebook, FaTwitter, FaInstagram, FaYoutube: icon mạng xã hội
// - FaEnvelope: icon email
// - FaPhone: icon điện thoại
// - FaMapMarkerAlt: icon vị trí/địa chỉ
// - FaPaperPlane: icon gửi (dùng trong button gửi email đăng ký)
// - FaHeart: icon trái tim (dùng cho lượt yêu thích)
// - FaCreditCard: icon thẻ tín dụng (dùng trong tính năng)
// - FaTruck: icon xe tải (dùng cho giao hàng)
// - FaShieldAlt: icon khiên (dùng cho bảo mật)

const Footer = () => {
  // Định nghĩa component Footer, không nhận prop từ bên ngoài

  const [email, setEmail] = useState("");
  // State lưu giá trị input email để đăng ký nhận tin

  const [showToast, setShowToast] = useState(false);
  // State điều khiển hiển thị Toast (thông báo) sau khi đăng ký thành công

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Ngăn form reload trang khi submit

    if (!email || !email.includes("@")) {
      // Nếu email rỗng hoặc không chứa '@', không thực hiện đăng ký
      return;
    }
    // Mô phỏng gọi API đăng ký (đợi 500ms rồi show Toast)
    setTimeout(() => {
      setShowToast(true);
      setEmail("");
      // Xóa trường email sau khi đăng ký thành công
    }, 500);
  };

  return (
    <footer className="bg-dark text-white pt-5">
      {/* Phần chân trang, nền màu tối, chữ màu trắng, padding-top = 5 */}
      <Container>
        {/* Phần tính năng (features) */}
        <Row className="py-4 mb-4 features-section">
          {/* Hàng đầu tiên: 4 tính năng */}
          <Col md={3} sm={6} className="mb-4 mb-md-0 text-center">
            {/* Cột 1: Giao hàng toàn quốc */}
            <div className="feature-item">
              <FaTruck size={36} className="text-primary mb-3" />
              {/* Icon xe tải, size 36, màu primary, margin-bottom = 3 */}
              <h6 className="fw-bold">Giao hàng toàn quốc</h6>
              {/* Tiêu đề tính năng, font-weight bold */}
              <p className="small text-muted">Giao hàng nhanh chóng</p>
              {/* Mô tả nhỏ, màu muted */}
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-4 mb-md-0 text-center">
            {/* Cột 2: Thanh toán linh hoạt */}
            <div className="feature-item">
              <FaCreditCard size={36} className="text-primary mb-3" />
              {/* Icon thẻ tín dụng */}
              <h6 className="fw-bold">Thanh toán linh hoạt</h6>
              <p className="small text-muted">Nhiều phương thức thanh toán</p>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-4 mb-md-0 text-center">
            {/* Cột 3: Bảo mật 100% */}
            <div className="feature-item">
              <FaShieldAlt size={36} className="text-primary mb-3" />
              {/* Icon khiên */}
              <h6 className="fw-bold">Bảo mật 100%</h6>
              <p className="small text-muted">Bảo mật thông tin khách hàng</p>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-4 mb-md-0 text-center">
            {/* Cột 4: Hỗ trợ 24/7 */}
            <div className="feature-item">
              <FaHeart size={36} className="text-primary mb-3" />
              {/* Icon trái tim */}
              <h6 className="fw-bold">Hỗ trợ 24/7</h6>
              <p className="small text-muted">Luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          {/* Hàng thứ hai: ba cột chính */}
          <Col lg={4} md={6} className="mb-4 mb-md-0">
            {/* Cột "Về OnlineStore" */}
            <h5 className="mb-3 fw-bold border-bottom border-primary border-2 pb-2 d-inline-block">
              Về OnlineStore
            </h5>
            <p className="mb-3">
              OnlineStore là hệ thống cửa hàng trực tuyến cung cấp các sản phẩm
              chất lượng cao với giá thành hợp lý, đảm bảo trải nghiệm mua sắm
              tốt nhất cho khách hàng.
            </p>
            <div className="mb-3">
              {/* Thông tin địa chỉ, điện thoại, email */}
              <div className="d-flex align-items-center mb-2">
                <FaMapMarkerAlt className="me-2 text-primary" />
                {/* Icon bản đồ */}
                <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaPhone className="me-2 text-primary" />
                {/* Icon điện thoại */}
                <a
                  href="tel:+8401234567890"
                  className="text-white text-decoration-none"
                >
                  0123 456 7890
                </a>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaEnvelope className="me-2 text-primary" />
                {/* Icon (email) */}
                <a
                  href="mailto:contact@onlinestore.com"
                  className="text-white text-decoration-none"
                >
                  contact@onlinestore.com
                </a>
              </div>
            </div>
          </Col>

          <Col lg={2} md={6} sm={6} className="mb-4 mb-md-0">
            {/* Cột "Liên kết" */}
            <h5 className="mb-3 fw-bold border-bottom border-primary border-2 pb-2 d-inline-block">
              Liên kết
            </h5>
            <ListGroup variant="flush" className="footer-links">
              {/* Dùng ListGroup để liệt kê các liên kết */}
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/"
                  className="text-white text-decoration-none hover-primary"
                >
                  Trang chủ
                </Link>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/about"
                  className="text-white text-decoration-none hover-primary"
                >
                  Giới thiệu
                </Link>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/products"
                  className="text-white text-decoration-none hover-primary"
                >
                  Sản phẩm
                </Link>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/contact"
                  className="text-white text-decoration-none hover-primary"
                >
                  Liên hệ
                </Link>
              </ListGroup.Item>
            </ListGroup>
          </Col>

          <Col lg={2} md={6} sm={6} className="mb-4 mb-md-0">
            {/* Cột "Chính sách" */}
            <h5 className="mb-3 fw-bold border-bottom border-primary border-2 pb-2 d-inline-block">
              Chính sách
            </h5>
            <ListGroup variant="flush" className="footer-links">
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/shipping-policy"
                  className="text-white text-decoration-none hover-primary"
                >
                  Chính sách vận chuyển
                </Link>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/return-policy"
                  className="text-white text-decoration-none hover-primary"
                >
                  Chính sách đổi trả
                </Link>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/privacy-policy"
                  className="text-white text-decoration-none hover-primary"
                >
                  Chính sách bảo mật
                </Link>
              </ListGroup.Item>
              <ListGroup.Item className="bg-transparent text-white border-0 ps-0 py-1">
                <Link
                  to="/terms"
                  className="text-white text-decoration-none hover-primary"
                >
                  Điều khoản dịch vụ
                </Link>
              </ListGroup.Item>
            </ListGroup>
          </Col>

          <Col lg={4} md={6} className="mb-4 mb-md-0">
            {/* Cột "Đăng ký nhận tin" */}
            <h5 className="mb-3 fw-bold border-bottom border-primary border-2 pb-2 d-inline-block">
              Đăng ký nhận tin
            </h5>
            <p className="mb-3">
              Đăng ký nhận thông tin về khuyến mãi và sản phẩm mới nhất từ chúng
              tôi.
            </p>
            <Form onSubmit={handleSubscribe}>
              {/* Form xử lý nhập email và submit */}
              <InputGroup className="mb-3">
                {/* Nhóm input (email) + nút gửi */}
                <Form.Control
                  placeholder="Email của bạn"
                  aria-label="Email subscription"
                  aria-describedby="subscribe-btn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
                <Button variant="primary" id="subscribe-btn" type="submit">
                  <FaPaperPlane />
                  {/* Icon giấy bay (gửi) */}
                </Button>
              </InputGroup>
            </Form>
            <div className="mt-4">
              {/* Phần "Kết nối với chúng tôi" */}
              <h6 className="mb-2 fw-bold">Kết nối với chúng tôi</h6>
              <div className="d-flex social-links">
                {/* Liên kết mạng xã hội */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white me-3 social-icon"
                >
                  <FaFacebook size={24} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white me-3 social-icon"
                >
                  <FaTwitter size={24} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white me-3 social-icon"
                >
                  <FaInstagram size={24} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white social-icon"
                >
                  <FaYoutube size={24} />
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <div className="copyright-area py-3 bg-darker mt-4">
        {/* Phần bản quyền */}
        <Container>
          <Row>
            <Col className="text-center">
              <p className="mb-0 small">
                © {new Date().getFullYear()} OnlineStore. Tất cả các quyền được
                bảo lưu.
                {/* Hiển thị năm hiện tại và bản quyền */}
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        style={{ position: "fixed", bottom: 20, right: 20 }}
      >
        {/* Thành phần Toast hiển thị khi đăng ký thành công */}
        <Toast.Header>
          <strong className="me-auto">Đăng ký thành công</strong>
        </Toast.Header>
        <Toast.Body>
          Cảm ơn bạn đã đăng ký nhận tin tức từ chúng tôi!
        </Toast.Body>
      </Toast>
    </footer>
  );
};

export default Footer;
