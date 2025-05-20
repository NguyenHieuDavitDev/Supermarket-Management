import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState: quản lý state cục bộ (email, mật khẩu, lỗi, loading, v.v.)
// - useEffect: thực hiện side effects (kiểm tra redirect khi đã login)

import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container, Row, Col: bố cục lưới
// - Form, Button: form và nút bấm
// - Card: khung chứa nội dung
// - Alert: hộp cảnh báo (error, success)
// - Tabs, Tab: thành phần tab (Đăng nhập, Đăng ký, Quên mật khẩu)

import { useNavigate, useLocation } from "react-router-dom";
// Import hook useNavigate để điều hướng programmatically
// Import hook useLocation để đọc query string (ví dụ redirect)

import { FaUser, FaLock, FaEnvelope, FaUserPlus } from "react-icons/fa";
// Import các icon từ react-icons/fa:
// - FaUser: icon người dùng (Họ tên, Avatar, v.v.)
// - FaLock: icon khóa (Mật khẩu)
// - FaEnvelope: icon phong bì (Email)
// - FaUserPlus: icon thêm người dùng (đăng ký)

import { loginUser, createUser } from "../../services/api";
// Import hai hàm gọi API:
// - loginUser: gọi API đăng nhập user, trả về token và user data
// - createUser: gọi API đăng ký user mới

const Login = ({ onLogin, isAuthenticated }) => {
  // Định nghĩa component Login, nhận hai prop:
  // - onLogin: callback để cập nhật state xác thực ở component cha sau khi login thành công
  // - isAuthenticated: boolean cho biết user đã đăng nhập hay chưa

  // === State cho chức năng đăng nhập ===
  const [loginEmail, setLoginEmail] = useState("");
  // State lưu giá trị input email khi đăng nhập

  const [loginPassword, setLoginPassword] = useState("");
  // State lưu giá trị input mật khẩu khi đăng nhập

  const [loginError, setLoginError] = useState("");
  // State lưu thông báo lỗi khi đăng nhập thất bại

  const [loginLoading, setLoginLoading] = useState(false);
  // State boolean để hiển thị loading spinner khi đang gửi request đăng nhập

  // === State cho chức năng đăng ký ===
  const [registerName, setRegisterName] = useState("");
  // State lưu giá trị input Họ tên khi đăng ký

  const [registerEmail, setRegisterEmail] = useState("");
  // State lưu giá trị input Email khi đăng ký

  const [registerPassword, setRegisterPassword] = useState("");
  // State lưu mật khẩu khi đăng ký

  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  // State lưu giá trị xác nhận mật khẩu khi đăng ký

  const [registerError, setRegisterError] = useState("");
  // State lưu thông báo lỗi khi đăng ký thất bại

  const [registerSuccess, setRegisterSuccess] = useState("");
  // State lưu thông báo thành công khi đăng ký thành công

  const [registerLoading, setRegisterLoading] = useState(false);
  // State boolean để hiển thị loading spinner khi gửi request đăng ký

  // === State cho chức năng quên mật khẩu ===
  const [resetEmail, setResetEmail] = useState("");
  // State lưu email để gửi yêu cầu đặt lại mật khẩu

  const [resetError, setResetError] = useState("");
  // State lưu thông báo lỗi khi gửi yêu cầu reset

  const [resetSuccess, setResetSuccess] = useState("");
  // State lưu thông báo thành công khi gửi yêu cầu reset thành công

  const [resetLoading, setResetLoading] = useState(false);
  // State boolean để hiển thị spinner khi xử lý yêu cầu reset

  // === State điều khiển tab hiển thị ===
  const [activeTab, setActiveTab] = useState("login");
  // State lưu tab đang active: "login" | "register" | "reset"

  const navigate = useNavigate();
  // Hook để điều hướng trang programmatically

  const location = useLocation();
  // Hook để lấy thông tin URL hiện tại, dùng để đọc query string redirect

  // === Side effect: Kiểm tra nếu user đã login và có param redirect ===
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Tạo đối tượng URLSearchParams từ query string
    const redirectTo = params.get("redirect");
    // Lấy giá trị param redirect (nếu có)

    const token = localStorage.getItem("token");
    // Kiểm tra token trong localStorage (nếu tồn tại, user có thể đã login)

    if (token && isAuthenticated) {
      // Nếu có token và isAuthenticated = true
      if (redirectTo) {
        navigate(`/${redirectTo}`);
        // Điều hướng đến đường dẫn redirect cụ thể
      } else {
        navigate("/");
        // Nếu không có redirect, chuyển về trang chủ
      }
    }
  }, [location, navigate, isAuthenticated]);
  // useEffect chạy khi thay đổi location, navigate hoặc isAuthenticated

  // === Xử lý submit form đăng nhập ===
  const handleLogin = async (e) => {
    e.preventDefault();
    // Ngăn form reload trang khi submit

    setLoginError("");
    // Reset thông báo lỗi

    setLoginLoading(true);
    // Hiển thị loading spinner

    try {
      const response = await loginUser({
        email: loginEmail,
        password: loginPassword,
      });
      // Gọi API loginUser với email và password

      localStorage.setItem("token", response.data.token);
      // Lưu token vào localStorage để xác thực

      localStorage.setItem("user", JSON.stringify(response.data.user));
      // Lưu user data thành JSON string vào localStorage

      if (onLogin) {
        onLogin(response.data.user);
        // Gọi callback onLogin để cập nhật state xác thực ở component cha
      }

      // Kiểm tra param redirect trong URL
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get("redirect");

      if (redirectTo) {
        navigate(`/${redirectTo}`);
        // Nếu có redirect, chuyển hướng sang đó
      } else {
        navigate("/");
        // Ngược lại, về trang chủ
      }
    } catch (error) {
      console.error("Login error:", error);
      // In lỗi ra console

      setLoginError(
        error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu."
      );
      // Cập nhật thông báo lỗi: nếu API trả về message, dùng message đó, ngược lại dùng thông báo mặc định
    } finally {
      setLoginLoading(false);
      // Ẩn loading spinner dù thành công hay thất bại
    }
  };

  // === Xử lý submit form đăng ký ===
  const handleRegister = async (e) => {
    e.preventDefault();
    // Ngăn form reload trang khi submit

    setRegisterError("");
    setRegisterSuccess("");
    setRegisterLoading(true);
    // Reset error, success và hiển thị loading spinner

    if (registerPassword !== registerPasswordConfirm) {
      // Kiểm tra mật khẩu và xác nhận mật khẩu có khớp không
      setRegisterError("Mật khẩu xác nhận không khớp.");
      setRegisterLoading(false);
      return;
      // Nếu không khớp, cập nhật error và dừng xử lý
    }

    try {
      const response = await createUser({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });
      // Gọi API createUser với name, email, password

      setRegisterSuccess(
        "Đăng ký thành công! Vui lòng đăng nhập với tài khoản mới của bạn."
      );
      // Cập nhật message thành công

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterPasswordConfirm("");
      // Reset các input form

      setTimeout(() => {
        setActiveTab("login");
        // Chuyển về tab "login" sau 2 giây
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      // In lỗi ra console

      setRegisterError(
        error.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng thử lại sau."
      );
      // Cập nhật thông báo lỗi: nếu API trả về message, dùng message đó, ngược lại dùng thông báo mặc định
    } finally {
      setRegisterLoading(false);
      // Ẩn loading spinner dù thành công hay thất bại
    }
  };

  // === Xử lý submit form quên mật khẩu ===
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    // Ngăn form reload trang khi submit

    setResetError("");
    setResetSuccess("");
    setResetLoading(true);
    // Reset state error, success và hiển thị loading spinner

    try {
      // Mô phỏng gửi yêu cầu reset mật khẩu (thường gọi API thực)
      setTimeout(() => {
        setResetSuccess(
          "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn."
        );
        // Cập nhật message thành công

        setResetEmail("");
        // Reset input email

        setResetLoading(false);
        // Tắt loading spinner
      }, 1500);
    } catch (error) {
      console.error("Password reset error:", error);
      // In lỗi ra console

      setResetError(
        "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau."
      );
      // Cập nhật thông báo lỗi

      setResetLoading(false);
      // Tắt loading spinner
    }
  };

  return (
    <Container className="py-5">
      {/* Container chính với padding trên/dưới = 5 */}
      <Row className="justify-content-center">
        {/* Hàng bố cục giữa màn hình */}
        <Col md={6}>
          {/* Cột rộng 6/12 ở màn hình trung bình (md) và lớn */}
          <Card className="shadow">
            {/* Khung Card với shadow */}
            <Card.Body className="p-4">
              {/* Nội dung bên trong card với padding = 4 */}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                {/* Thành phần Tabs, activeKey bind với activeTab state */}
                {/* onSelect gọi setActiveTab để chuyển tab */}
                <Tab eventKey="login" title="Đăng nhập">
                  {/* Tab 1: Đăng nhập */}
                  {loginError && <Alert variant="danger">{loginError}</Alert>}
                  {/* Nếu loginError không rỗng, hiển thị Alert lỗi */}

                  <Form onSubmit={handleLogin}>
                    {/* Form xử lý login, onSubmit gọi handleLogin */}
                    <Form.Group className="mb-3">
                      {/* Nhóm input Email */}
                      <Form.Label>Email</Form.Label>
                      <div className="input-group">
                        {/* Thêm icon vào nhóm input */}
                        <span className="input-group-text">
                          <FaEnvelope />
                        </span>
                        <Form.Control
                          type="email"
                          placeholder="Nhập email của bạn"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      {/* Nhóm input Password */}
                      <Form.Label>Mật khẩu</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <Form.Control
                          type="password"
                          placeholder="Nhập mật khẩu"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="d-flex justify-content-end mt-1">
                        {/* Nút Quên mật khẩu */}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => setActiveTab("reset")}
                        >
                          Quên mật khẩu?
                        </Button>
                      </div>
                    </Form.Group>

                    <div className="d-grid">
                      {/* Nút Đăng nhập full-width */}
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loginLoading}
                      >
                        {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                        {/* Hiển thị text khác nếu đang loading */}
                      </Button>
                    </div>
                  </Form>

                  <div className="text-center mt-3">
                    {/* Link chuyển sang tab Đăng ký */}
                    <p>
                      Chưa có tài khoản?{" "}
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => setActiveTab("register")}
                      >
                        Đăng ký ngay
                      </Button>
                    </p>
                  </div>
                </Tab>

                <Tab eventKey="register" title="Đăng ký">
                  {/* Tab 2: Đăng ký */}
                  {registerError && (
                    <Alert variant="danger">{registerError}</Alert>
                  )}
                  {/* Nếu registerError tồn tại, hiển thị Alert lỗi */}

                  {registerSuccess && (
                    <Alert variant="success">{registerSuccess}</Alert>
                  )}
                  {/* Nếu registerSuccess tồn tại, hiển thị Alert thành công */}

                  <Form onSubmit={handleRegister}>
                    {/* Form xử lý đăng ký, onSubmit gọi handleRegister */}
                    <Form.Group className="mb-3">
                      {/* Nhóm input Họ tên */}
                      <Form.Label>Họ tên</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="Nhập họ tên của bạn"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      {/* Nhóm input Email */}
                      <Form.Label>Email</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope />
                        </span>
                        <Form.Control
                          type="email"
                          placeholder="Nhập email của bạn"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      {/* Nhóm input Password */}
                      <Form.Label>Mật khẩu</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <Form.Control
                          type="password"
                          placeholder="Nhập mật khẩu"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        {/* minLength để bắt buộc nhập tối thiểu 6 ký tự */}
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      {/* Nhóm input Xác nhận mật khẩu */}
                      <Form.Label>Xác nhận mật khẩu</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <Form.Control
                          type="password"
                          placeholder="Nhập lại mật khẩu"
                          value={registerPasswordConfirm}
                          onChange={(e) =>
                            setRegisterPasswordConfirm(e.target.value)
                          }
                          required
                          minLength={6}
                        />
                      </div>
                    </Form.Group>

                    <div className="d-grid">
                      {/* Nút Đăng ký full-width */}
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={registerLoading}
                      >
                        {registerLoading ? "Đang đăng ký..." : "Đăng ký"}
                      </Button>
                    </div>
                  </Form>

                  <div className="text-center mt-3">
                    {/* Link chuyển qua tab Đăng nhập */}
                    <p>
                      Đã có tài khoản?{" "}
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => setActiveTab("login")}
                      >
                        Đăng nhập
                      </Button>
                    </p>
                  </div>
                </Tab>

                <Tab eventKey="reset" title="Quên mật khẩu">
                  {/* Tab 3: Quên mật khẩu */}
                  {resetError && <Alert variant="danger">{resetError}</Alert>}
                  {/* Nếu resetError tồn tại, hiển thị Alert lỗi */}

                  {resetSuccess && (
                    <Alert variant="success">{resetSuccess}</Alert>
                  )}
                  {/* Nếu resetSuccess tồn tại, hiển thị Alert thành công */}

                  <Form onSubmit={handlePasswordReset}>
                    {/* Form xử lý quên mật khẩu, onSubmit gọi handlePasswordReset */}
                    <Form.Group className="mb-3">
                      {/* Nhóm input Email để nhận link reset */}
                      <Form.Label>Email</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope />
                        </span>
                        <Form.Control
                          type="email"
                          placeholder="Nhập email đã đăng ký"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                    </Form.Group>

                    <div className="d-grid">
                      {/* Nút Gửi yêu cầu reset full-width */}
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={resetLoading}
                      >
                        {resetLoading
                          ? "Đang gửi..."
                          : "Gửi yêu cầu đặt lại mật khẩu"}
                      </Button>
                    </div>
                  </Form>

                  <div className="text-center mt-3">
                    {/* Link quay lại tab Đăng nhập */}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => setActiveTab("login")}
                    >
                      Quay lại đăng nhập
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
