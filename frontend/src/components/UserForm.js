import React, { useState, useEffect } from "react";
import { createUser, updateUser, getRoles } from "../services/api"; // Thêm getRoles

const UserForm = ({ refreshUsers, editingUser, setEditingUser }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    avatar: null,
  });

  const [roles, setRoles] = useState([]); // Danh sách vai trò

  // Lấy danh sách vai trò từ API khi component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles(); // Gọi API lấy roles
        setRoles(response.data); // Lưu vào state
      } catch (error) {
        console.error("Lỗi khi lấy danh sách roles:", error);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        email: editingUser.email,
        password: "",
        roleId: editingUser.roleId || "",
        avatar: null,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        roleId: "",
        avatar: null,
      });
    }
  }, [editingUser]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
      } else {
        await createUser(data);
      }
      setFormData({
        username: "",
        email: "",
        password: "",
        roleId: "",
        avatar: null,
      });
      setEditingUser(null);
      refreshUsers();
    } catch (error) {
      console.error("Error submit user", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="my-3">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            {editingUser ? "Cập nhật người dùng" : "Thêm mới người dùng"}
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  id="username"
                  type="text"
                  className="form-control"
                  name="username"
                  placeholder="Nhập username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Nhập password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingUser}
                />
              </div>
            </div>

            {/* Role - Chuyển từ input sang select */}
            <div className="col-12 col-md-6">
              <label htmlFor="roleId" className="form-label">
                Role
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-user-tag"></i>
                </span>
                <select
                  id="roleId"
                  className="form-control"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="avatar" className="form-label">
                Avatar
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-image"></i>
                </span>
                <input
                  id="avatar"
                  type="file"
                  className="form-control"
                  name="avatar"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer text-end">
          <button type="submit" className="btn btn-primary">
            {editingUser ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default UserForm;
