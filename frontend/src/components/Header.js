import React from "react";
// Import React để sử dụng JSX và tạo component React

const Header = ({ onLogout }) => {
  // Định nghĩa một functional component Header nhận props là onLogout (hàm xử lý đăng xuất)

  let user = { email: "User" };
  // Khởi tạo biến user mặc định với email là "User" (dùng làm fallback nếu không có dữ liệu thực)

  try {
    // Thử lấy dữ liệu user từ localStorage
    const userString = localStorage.getItem("user");
    // Lấy chuỗi JSON lưu trong localStorage với key "user"

    if (userString) {
      // Nếu có dữ liệu user trong localStorage (không null hoặc undefined)
      user = JSON.parse(userString);
      // Chuyển chuỗi JSON thành object JavaScript và gán cho biến user
    }
  } catch (error) {
    // Bắt lỗi nếu có lỗi trong quá trình parse JSON (ví dụ dữ liệu bị hỏng hoặc không đúng định dạng)
    console.error("Error parsing user data:", error);
    // In lỗi ra console để dễ debug
  }

  return (
    // Trả về JSX render header bar
    <header className="navbar navbar-dark bg-primary p-3">
      {/* Phần header với class bootstrap navbar màu nền xanh primary và padding 3 */}
      <div className="container-fluid">
        {/* Container full width theo bootstrap */}
        <a className="navbar-brand" href="/dashboard">
          {/* Link nhãn hiệu điều hướng về trang dashboard */}
          Dashboard Admin
        </a>
        <div className="d-flex align-items-center">
          {/* Khối chứa thông tin người dùng và nút đăng xuất, dùng flexbox căn giữa theo trục dọc */}
          <span className="text-white me-3">
            {/* Hiển thị email người dùng màu trắng, margin-right 3 */}
            Xin chào, {user.email || "User"}
            {/* Hiển thị email lấy từ biến user, nếu không có thì hiển thị "User" */}
          </span>
          <button onClick={onLogout} className="btn btn-light btn-sm">
            {/* Nút đăng xuất, khi click gọi hàm onLogout được truyền từ props */}
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
