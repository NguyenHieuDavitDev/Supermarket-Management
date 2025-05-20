import React, { useState, useEffect } from "react"; // Import React và các hook useState, useEffect để quản lý state và side effect
import { useNavigate } from "react-router-dom"; // Import hook useNavigate để điều hướng trang (redirect)
import Header from "./Header"; // Import component Header hiển thị header của dashboard
import UserList from "./UserList"; // Import component danh sách người dùng
import RoleList from "./RoleList"; // Import component danh sách vai trò
import CategoryList from "./CategoryList"; // Import component danh sách danh mục sản phẩm
import SupplierPage from "../pages/SupplierPage"; // Import trang quản lý nhà cung cấp
import ProductPage from "../pages/ProductPage"; // Import trang quản lý sản phẩm
import OrderPage from "../pages/OrderPage"; // Import trang quản lý đơn hàng
import { checkAuth } from "../services/api"; // Import hàm kiểm tra xác thực từ API

// Component chính của Dashboard, quản lý trạng thái tab và xác thực
const Dashboard = () => {
  // activeTab dùng để lưu tab đang được chọn, mặc định là "dashboard"
  const [activeTab, setActiveTab] = useState("dashboard");

  // loading thể hiện trạng thái đang tải dữ liệu (xác thực)
  const [loading, setLoading] = useState(true);

  // error lưu thông báo lỗi nếu có vấn đề xác thực hoặc tải dữ liệu
  const [error, setError] = useState("");

  // useNavigate hook dùng để điều hướng trang (ví dụ redirect về /login)
  const navigate = useNavigate();

  // useEffect thực thi một lần sau khi component mount, dùng để kiểm tra xác thực người dùng
  useEffect(() => {
    // Hàm async để gọi API kiểm tra token hợp lệ
    const verifyAuth = async () => {
      try {
        console.log("Verifying authentication for dashboard...");

        // Lấy token từ localStorage
        const token = localStorage.getItem("token");

        // Nếu không có token, ném lỗi để bắt vào catch
        if (!token) {
          throw new Error("No token found");
        }

        // Gọi API checkAuth để kiểm tra token còn hợp lệ không
        const response = await checkAuth();

        // Log kết quả trả về của API (thường là dữ liệu user hoặc status)
        console.log("Authentication check response:", response.data);

        // Sau khi xác thực thành công, chuyển loading về false
        setLoading(false);
      } catch (error) {
        // Nếu có lỗi (token không hợp lệ, hết hạn...), log lỗi ra console
        console.error("Dashboard auth error:", error);

        // Hiển thị thông báo lỗi xác thực
        setError("Phiên đăng nhập đã hết hạn hoặc không hợp lệ");

        // Xóa token và thông tin user trong localStorage để đảm bảo không lưu trữ dữ liệu cũ
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Đợi 1 giây rồi chuyển hướng về trang đăng nhập
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }
    };

    // Gọi hàm verifyAuth ngay khi component mount
    verifyAuth();

    // Thêm navigate vào dependencies để cảnh báo eslint khi navigate thay đổi (thường không thay đổi)
  }, [navigate]);

  // Hàm xử lý đăng xuất: xóa token, user rồi điều hướng về trang login
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Hàm render nội dung chính theo tab đang active
  const renderContent = () => {
    switch (activeTab) {
      case "userManagement": // Nếu tab đang là quản lý người dùng
        return <UserList />; // Render component danh sách người dùng
      case "roleManagement": // Quản lý vai trò
        return <RoleList />; // Render component danh sách vai trò
      case "categoryManagement": // Quản lý danh mục sản phẩm
        return <CategoryList />; // Render component danh mục
      case "supplierManagement": // Quản lý nhà cung cấp
        return <SupplierPage />; // Render trang nhà cung cấp
      case "productManagement": // Quản lý sản phẩm
        return <ProductPage />; // Render trang sản phẩm
      case "orderManagement": // Quản lý đơn hàng
        return <OrderPage />; // Render trang đơn hàng
      case "dashboard": // Tab mặc định là dashboard (trang chính)
      default:
        // Render lời chào mừng khi vào dashboard
        return (
          <div className="p-4">
            <h2>Chào mừng đến Dashboard</h2>
            <p>Chọn mục bên trái để xem chức năng.</p>
          </div>
        );
    }
  };

  // Nếu đang ở trạng thái loading (đang kiểm tra xác thực), hiển thị loading spinner hoặc thông báo
  if (loading) {
    return <div className="text-center p-5">Đang tải...</div>;
  }

  // Nếu có lỗi xác thực, hiển thị thông báo lỗi và chuyển hướng
  if (error) {
    return (
      <div className="text-center p-5">
        <div className="alert alert-danger">{error}</div>
        <p>Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  // Giao diện chính Dashboard khi đã xác thực thành công
  return (
    <div className="container-fluid p-0">
      {/* Header chứa nút đăng xuất và các thông tin trên cùng */}
      <Header onLogout={handleLogout} />

      {/* Layout 2 cột: menu bên trái và nội dung bên phải */}
      <div className="row g-0">
        {/* Thanh menu bên trái dạng sidebar, chiếm 2 cột trên md trở lên */}
        <aside className="col-md-2 vh-100 p-0 shadow bg-dark">
          <ul className="nav flex-column pt-3">
            {/* Các nút menu điều hướng bằng cách setActiveTab, highlight nút đang active */}
            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "dashboard" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("dashboard")} // Chuyển tab dashboard
              >
                <i className="fas fa-home me-2"></i> Dashboard
              </button>
            </li>

            {/* Các mục menu khác tương tự */}
            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "userManagement" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("userManagement")} // Chọn tab quản lý người dùng
              >
                <i className="fas fa-users me-2"></i> Quản lý người dùng
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "roleManagement" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("roleManagement")} // Chọn tab quản lý vai trò
              >
                <i className="fas fa-user-tag me-2"></i> Quản lý vai trò
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "categoryManagement" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("categoryManagement")} // Quản lý danh mục
              >
                <i className="fas fa-list me-2"></i> Quản lý danh mục
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "supplierManagement" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("supplierManagement")} // Quản lý nhà cung cấp
              >
                <i className="fas fa-truck me-2"></i> Quản lý nhà cung cấp
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "productManagement" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("productManagement")} // Quản lý sản phẩm
              >
                <i className="fas fa-box me-2"></i> Quản lý sản phẩm
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link text-white bg-transparent border-0 ${
                  activeTab === "orderManagement" ? "active fw-bold" : ""
                }`}
                onClick={() => setActiveTab("orderManagement")} // Quản lý đơn hàng
              >
                <i className="fas fa-shopping-cart me-2"></i> Quản lý đơn hàng
              </button>
            </li>

            {/* Nút đăng xuất */}
            <li className="nav-item mt-3">
              <button
                className="nav-link text-white bg-transparent border-0"
                onClick={handleLogout} // Gọi hàm đăng xuất
              >
                <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
              </button>
            </li>
          </ul>
        </aside>

        {/* Nội dung chính bên phải, chiếm 10 cột trên md trở lên */}
        <main className="col-md-10 px-4 py-3 bg-light">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard; // Export component Dashboard làm default export
