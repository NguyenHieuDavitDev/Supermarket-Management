// Nhập các hook cần thiết từ React
import React, { useState } from "react";
// Nhập hàm createRole từ file API service để tạo mới vai trò qua API
import { createRole } from "../services/api";

// Khai báo component RoleForm nhận vào props:
// - refreshRoles: callback để load lại danh sách vai trò sau khi thêm
// - closeModal: callback để đóng modal sau khi thao tác xong
const RoleForm = ({ refreshRoles, closeModal }) => {
  // Khai báo state để lưu giá trị nhập từ input tên vai trò
  const [name, setName] = useState("");

  // Hàm xử lý khi form được submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form submit mặc định gây reload trang
    await createRole({ name }); // Gọi API tạo mới vai trò với tên được nhập
    refreshRoles(); // Sau khi tạo xong, gọi callback để cập nhật lại danh sách vai trò
    closeModal(); // Đóng modal sau khi thêm xong
  };

  // JSX hiển thị form
  return (
    <form onSubmit={handleSubmit} className="p-3">
      {" "}
      {/* Form có padding 3 */}
      <div className="mb-3">
        {" "}
        {/* Thêm khoảng cách dưới cho phần tử */}
        <label className="form-label">Tên vai trò</label> {/* Nhãn cho input */}
        <input
          type="text" // Trường nhập dạng văn bản
          className="form-control" // Áp dụng class Bootstrap để styling
          placeholder="Nhập tên vai trò" // Placeholder hiển thị mờ trong input
          value={name} // Giá trị điều khiển bởi state name
          onChange={(e) => setName(e.target.value)} // Cập nhật state khi người dùng nhập
          required // Bắt buộc phải nhập giá trị (HTML validation)
        />
      </div>
      <div className="d-flex justify-content-end">
        {" "}
        {/* Canh các nút về bên phải */}
        <button
          type="button" // Không submit form, chỉ gọi hàm đóng modal
          className="btn btn-secondary me-2" // Nút màu xám với margin phải
          onClick={closeModal} // Gọi hàm đóng modal khi bấm
        >
          Hủy {/* Nhãn nút */}
        </button>
        <button type="submit" className="btn btn-success">
          <i className="fas fa-plus me-2"></i> {/* Icon FontAwesome dấu cộng */}
          Thêm {/* Nhãn nút */}
        </button>
      </div>
    </form>
  );
};

export default RoleForm;
