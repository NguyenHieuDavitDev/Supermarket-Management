import React, { useState } from "react";
// Import React và hook useState để quản lý state cục bộ trong component

import {
  Navbar,
  Nav,
  Container,
  Form,
  Button,
  InputGroup,
  Dropdown,
  Badge,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Navbar, Nav: thanh điều hướng
// - Container: để căn giữa nội dung
// - Form, Button, InputGroup: form tìm kiếm
// - Dropdown: menu thả xuống cho user
// - Badge: hiển thị số lượng trong giỏ hàng

import { Link, useNavigate } from "react-router-dom";
// Import Link để điều hướng nội bộ (client-side routing)
// Import useNavigate để điều hướng programmatically

import {
  FaUser,
  FaShoppingCart,
  FaSearch,
  FaSignOutAlt,
  FaHistory,
} from "react-icons/fa";
// Import các icon từ react-icons/fa:
// - FaUser: icon user
// - FaShoppingCart: icon giỏ hàng
// - FaSearch: icon tìm kiếm
// - FaSignOutAlt: icon đăng xuất
// - FaHistory: icon lịch sử

const Header = ({ cartItemCount = 0, isAuthenticated, user, onLogout }) => {
  // Định nghĩa component Header, nhận props:
  // - cartItemCount: số lượng item trong giỏ, mặc định 0
  // - isAuthenticated: boolean, true nếu user đã đăng nhập
  // - user: object chứa thông tin user (tên, role, v.v.)
  // - onLogout: hàm gọi khi user nhấn đăng xuất

  const [searchTerm, setSearchTerm] = useState("");
  // State lưu giá trị input tìm kiếm

  const navigate = useNavigate();
  // Hook useNavigate để điều hướng trang programmatically

  const handleSearch = (e) => {
    e.preventDefault();
    // Ngăn form reload trang khi submit

    if (searchTerm.trim()) {
      // Nếu có từ khóa tìm kiếm không rỗng
      navigate(`/store/products?search=${encodeURIComponent(searchTerm)}`);
      // Chuyển tới trang sản phẩm với query string chứa searchTerm được encode
    }
  };

  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="lg"
      sticky="top"
      className="py-3"
    >
      {/* Thanh navbar nền màu primary, chữ màu sáng, mở rộng ở màn hình lớn, dính top, padding y = 3 */}
      <Container>
        {/* Bọc nội dung trong Container để căn giữa */}

        <Navbar.Brand as={Link} to="/store">
          {/* Logo/tên thương hiệu, khi click điều hướng về /store */}
          <strong>OnlineStore</strong>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        {/* Nút toggle để thu gọn navbar trên màn hình nhỏ */}

        <Navbar.Collapse id="main-navbar">
          {/* Phần collapsible chứa nav links và form tìm kiếm */}

          <Nav className="me-auto">
            {/* Nav links căn trái (margin-end auto để đẩy sang trái) */}
            <Nav.Link as={Link} to="/store">
              Trang chủ
            </Nav.Link>
            <Nav.Link as={Link} to="/store/products">
              Sản phẩm
            </Nav.Link>
            <Nav.Link as={Link} to="/store/promotions">
              Khuyến mãi
            </Nav.Link>
            <Nav.Link as={Link} to="/store/contact">
              Liên hệ
            </Nav.Link>
          </Nav>

          <Form className="d-flex mx-3 flex-grow-1" onSubmit={handleSearch}>
            {/* Form tìm kiếm, d-flex để hiện input và nút cạnh nhau, mx-3 margin ngang, flex-grow-1 cho phép rộng */}
            <InputGroup>
              {/* Nhóm input + button */}
              <Form.Control
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search"
              />
              <Button variant="light" type="submit">
                {/* Nút submit với icon tìm kiếm */}
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>

          <Nav>
            {/* Phần Nav ở phải bao gồm giỏ hàng và tài khoản */}
            <Nav.Link
              as={Link}
              to="/store/cart"
              className="me-2 position-relative"
            >
              {/* Link tới trang giỏ hàng */}
              <FaShoppingCart size={20} />
              {/* Icon giỏ hàng, size 20 */}
              {cartItemCount > 0 && (
                // Nếu có item trong giỏ, hiển thị Badge
                <Badge
                  pill
                  bg="danger"
                  className="position-absolute"
                  style={{ top: "-5px", right: "-5px", fontSize: "0.6rem" }}
                >
                  {cartItemCount}
                  {/* Số lượng item */}
                </Badge>
              )}
            </Nav.Link>

            {isAuthenticated ? (
              // Nếu user đã đăng nhập, hiển thị dropdown user
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="link"
                  id="user-dropdown"
                  className="nav-link text-white"
                >
                  <FaUser /> {user?.name || "Tài khoản"}
                  {/* Icon user và hiển thị tên nếu có, ngược lại "Tài khoản" */}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/store/profile">
                    Thông tin tài khoản
                    {/* Link tới trang thông tin user */}
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/store/orders">
                    <FaHistory className="me-2" /> Lịch sử đơn hàng
                    {/* Icon lịch sử và link tới trang lịch sử đơn */}
                  </Dropdown.Item>
                  {user?.role?.name === "admin" && (
                    // Nếu user có role admin, hiển thị thêm mục Quản trị
                    <Dropdown.Item as={Link} to="/dashboard">
                      Quản trị
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={onLogout}>
                    {/* Nút đăng xuất */}
                    <FaSignOutAlt className="me-2" /> Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              // Nếu chưa đăng nhập, hiển thị link Đăng nhập
              <Nav.Link as={Link} to="/store/login">
                <FaUser className="me-1" /> Đăng nhập
                {/* Icon user và chữ "Đăng nhập" */}
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
