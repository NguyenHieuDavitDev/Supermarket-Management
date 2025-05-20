import { useState, useEffect } from "react";
// Import các hook useState để quản lý state và useEffect để chạy hiệu ứng phụ
import { useNavigate } from "react-router-dom";
// Import hook useNavigate để điều hướng chuyển trang trong React Router
import { loginUser, checkAuth } from "../services/api";
// Import các hàm API để đăng nhập và kiểm tra xác thực token

const Login = () => {
  // functional component Login không nhận props

  // Khai báo các state quản lý dữ liệu input và trạng thái
  const [email, setEmail] = useState(""); // Email người dùng nhập, khởi tạo rỗng
  const [password, setPassword] = useState(""); // Mật khẩu người dùng nhập, khởi tạo rỗng
  const [error, setError] = useState(""); // Lỗi hiển thị khi đăng nhập thất bại, khởi tạo rỗng
  const [loading, setLoading] = useState(true); // Trạng thái đang tải, khởi tạo là true (đang tải)
  const navigate = useNavigate(); // Hook dùng để điều hướng chuyển trang

  useEffect(() => {
    // useEffect chạy 1 lần khi component mount, dùng để kiểm tra trạng thái đăng nhập người dùng

    const verifyAuth = async () => {
      // Hàm async để kiểm tra token đăng nhập hợp lệ hay không
      const token = localStorage.getItem("token");
      // Lấy token từ localStorage (nếu có)

      if (token) {
        // Nếu có token, kiểm tra tính hợp lệ
        try {
          await checkAuth();
          // Gọi API checkAuth để xác nhận token còn hiệu lực
          navigate("/dashboard");
          // Nếu hợp lệ, chuyển hướng tới trang dashboard (đã đăng nhập)
        } catch (error) {
          // Nếu token không hợp lệ hoặc lỗi xác thực
          console.error("Authentication error:", error);
          // In lỗi ra console
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Xóa token và user trong localStorage để đảm bảo đăng xuất
          setLoading(false);
          // Kết thúc trạng thái loading để hiển thị form đăng nhập
        }
      } else {
        // Nếu không có token, không cần kiểm tra, kết thúc loading
        setLoading(false);
      }
    };

    verifyAuth();
    // Gọi hàm verifyAuth để kiểm tra xác thực ngay khi component render
  }, [navigate]);
  // Dependency là navigate, nếu navigate thay đổi thì hàm sẽ chạy lại (thường thì không thay đổi)

  const handleSubmit = async (e) => {
    // Hàm xử lý sự kiện submit form đăng nhập
    e.preventDefault();
    // Ngăn reload trang mặc định khi submit form
    setError("");
    // Xóa thông báo lỗi cũ khi bắt đầu đăng nhập mới

    try {
      console.log("Attempting login with:", { email, password });
      // Log ra console email và password gửi đi (debug)

      const response = await loginUser({ email, password });
      // Gọi API đăng nhập với email và password

      console.log("Login response:", response);
      // Log kết quả phản hồi từ server

      if (response && response.data) {
        // Nếu có dữ liệu phản hồi thành công
        localStorage.setItem("token", response.data.token);
        // Lưu token nhận được vào localStorage để xác thực cho các request sau

        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          // Nếu server gửi thông tin user, lưu dưới dạng chuỗi JSON vào localStorage
        }
        navigate("/dashboard");
        // Chuyển hướng sang trang dashboard khi đăng nhập thành công
      }
    } catch (err) {
      // Bắt lỗi nếu đăng nhập thất bại
      console.error("Login error:", err);
      // In lỗi chi tiết ra console để debug

      // Hiển thị thông báo lỗi: nếu server gửi message lỗi thì hiển thị, nếu không thì dùng thông báo mặc định
      setError(
        err.response?.data?.message ||
          "Lỗi đăng nhập, kiểm tra email và mật khẩu"
      );
    }
  };

  if (loading) {
    // Nếu đang ở trạng thái loading (đang kiểm tra token hoặc chờ API)
    return <div className="text-center p-5">Đang tải...</div>;
    // Hiển thị giao diện loading cho người dùng biết
  }

  // JSX giao diện form đăng nhập
  return (
    <div className="container mt-5">
      <h2>Đăng nhập</h2>

      {/* Nếu có lỗi đăng nhập thì hiển thị alert màu đỏ */}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Form đăng nhập, khi submit gọi hàm handleSubmit */}
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email" // Kiểu input email
            className="form-control" // Class bootstrap style input
            value={email} // Giá trị liên kết với state email
            onChange={(e) => setEmail(e.target.value)}
            // Khi nhập thay đổi sẽ cập nhật state email
            required // Bắt buộc nhập trường này
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password" // Kiểu input mật khẩu
            className="form-control"
            value={password} // Giá trị liên kết với state password
            onChange={(e) => setPassword(e.target.value)}
            // Cập nhật state password khi thay đổi
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Đăng nhập
        </button>
      </form>

      <div className="mt-3">
        {/* Link điều hướng về trang chủ Store */}
        <a href="/store">Quay lại trang chủ Store</a>
      </div>
    </div>
  );
};

export default Login;
// Xuất component Login để sử dụng ở các phần khác
