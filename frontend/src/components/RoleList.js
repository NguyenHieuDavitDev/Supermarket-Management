import React, { useEffect, useState } from "react";
import { getRoles, deleteRole } from "../services/api";
import RoleForm from "./RoleForm";
import { Modal } from "react-bootstrap";

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách vai trò", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vai trò này?")) {
      await deleteRole(id);
      fetchRoles();
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          <i className="fas fa-user-shield me-2"></i>Danh sách vai trò
        </h2>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-2"></i> Thêm mới
        </button>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thêm Vai Trò</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RoleForm
            refreshRoles={fetchRoles}
            closeModal={() => setShowModal(false)}
          />
        </Modal.Body>
      </Modal>

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Tên vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {roles.length > 0 ? (
              roles.map((role, index) => (
                <tr key={role.id}>
                  <td>{index + 1}</td>
                  <td>{role.name}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(role.id)}
                    >
                      <i className="fas fa-trash-alt"></i> Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
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
