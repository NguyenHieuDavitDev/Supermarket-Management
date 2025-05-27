// Import các hook và thư viện cần thiết từ React
import React, { useEffect, useState } from "react";
// Import các hàm API thao tác với vai trò
import { getRoles, deleteRole } from "../services/api";
// Import component form để thêm vai trò
import RoleForm from "./RoleForm";
// Import Modal từ react-bootstrap để hiển thị form trong modal
import { Modal } from "react-bootstrap";

// Component chính quản lý danh sách vai trò
const RoleList = () => {
  // State để lưu danh sách vai trò từ server
  const [roles, setRoles] = useState([]);
  // State để kiểm soát hiển thị modal thêm vai trò
  const [showModal, setShowModal] = useState(false);

  // Hàm lấy danh sách vai trò từ API
  const fetchRoles = async () => {
    try {
      const response = await getRoles(); // Gọi API
      setRoles(response.data); // Cập nhật state với dữ liệu trả về
    } catch (error) {
      console.error("Lỗi lấy danh sách vai trò", error); // Log lỗi nếu có
    }
  };

  // useEffect gọi fetchRoles khi component được render lần đầu
  useEffect(() => {
    fetchRoles(); // Gọi lấy dữ liệu ban đầu
  }, []); // Mảng rỗng nghĩa là chỉ chạy một lần khi mount

  // Hàm xử lý xóa vai trò
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vai trò này?")) {
      await deleteRole(id); // Gọi API xóa theo id
      fetchRoles(); // Tải lại danh sách vai trò sau khi xóa
    }
  };

  // JSX trả về UI
  return (
    <div className="container mt-4">
      {" "}
      {/* Container Bootstrap với margin top */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Tiêu đề và nút thêm mới */}
        <h2>
          <i className="fas fa-user-shield me-2"></i>Danh sách vai trò
        </h2>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-2"></i> Thêm mới
        </button>
      </div>
      {/* Modal hiển thị form thêm vai trò */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thêm Vai Trò</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RoleForm
            refreshRoles={fetchRoles} // Truyền hàm reload danh sách sau khi thêm
            closeModal={() => setShowModal(false)} // Đóng modal khi hoàn tất
          />
        </Modal.Body>
      </Modal>
      {/* Bảng hiển thị danh sách vai trò */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            {" "}
            {/* Header màu tối */}
            <tr>
              <th>#</th>
              <th>Tên vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {/* Kiểm tra nếu có vai trò thì hiển thị, ngược lại hiện thông báo trống */}
            {roles.length > 0 ? (
              roles.map((role, index) => (
                <tr key={role.id}>
                  <td>{index + 1}</td> {/* STT */}
                  <td>{role.name}</td> {/* Tên vai trò */}
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(role.id)} // Gọi xóa khi click
                    >
                      <i className="fas fa-trash-alt"></i> Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Nếu không có dữ liệu thì hiển thị dòng thông báo
              <tr>
                <td colSpan="3" className="text-center">
                  Không có vai trò nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleList;
