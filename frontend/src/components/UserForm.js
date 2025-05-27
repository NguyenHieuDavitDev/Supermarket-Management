import React, { useState, useEffect } from "react";
// Import các hàm API liên quan đến User và Role
import { createUser, updateUser, getRoles } from "../services/api";

const UserForm = ({ refreshUsers, editingUser, setEditingUser }) => {
  // State chứa dữ liệu form: username, email, password, roleId, avatar (file)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    avatar: null,
  });

  // State lưu mảng các Role (để hiển thị trong <select>)
  const [roles, setRoles] = useState([]);

  //
  // 1. Khi component mount, gọi API lấy danh sách role
  //
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles(); // Gọi API getRoles()
        setRoles(response.data); // Lưu mảng roles vào state
      } catch (error) {
        console.error("Lỗi khi lấy danh sách roles:", error);
      }
    };
    fetchRoles();
  }, []); // Chỉ chạy một lần khi mount

  //
  // 2. Khi prop editingUser thay đổi (null hoặc object), thiết lập lại formData
  //
  useEffect(() => {
    if (editingUser) {
      // Nếu đang chỉnh sửa, gán giá trị từ editingUser vào formData,
      // nhưng password để rỗng (chỉ nhập khi muốn đổi password)
      setFormData({
        username: editingUser.username,
        email: editingUser.email,
        password: "",
        roleId: editingUser.roleId || "",
        avatar: null, // Không load sẵn avatar cũ, nếu muốn sẽ xử lý thêm
      });
    } else {
      // Nếu thêm mới (editingUser = null), reset về state mặc định
      setFormData({
        username: "",
        email: "",
        password: "",
        roleId: "",
        avatar: null,
      });
    }
  }, [editingUser]);

  //
  // 3. Hàm handleChange: Xử lý khi input, select, file thay đổi
  //
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    // Nếu field name = "avatar", files[0] là file được chọn
    if (name === "avatar") {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      // Các trường text, email, password, roleId
      setFormData({ ...formData, [name]: value });
    }
  };

  //
  // 4. Hàm handleSubmit: khi người dùng submit form
  //
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn reload trang
    // Tạo một FormData để đính kèm cả file avatar nếu có
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      if (editingUser) {
        // Nếu đang edit, gọi API updateUser với id và dữ liệu FormData
        await updateUser(editingUser.id, data);
      } else {
        // Nếu thêm mới, gọi API createUser
        await createUser(data);
      }
      // Sau khi lưu thành công, reset formData về mặc định
      setFormData({
        username: "",
        email: "",
        password: "",
        roleId: "",
        avatar: null,
      });
      // Hủy chế độ editing (đóng form hoặc chuyển sang trạng thái thêm mới)
      setEditingUser(null);
      // Gọi callback để reload lại danh sách users ở component cha
      refreshUsers();
    } catch (error) {
      console.error("Error submit user", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="my-3">
      <div className="card shadow-sm border-0">
        {/* Header của card (tiêu đề form) */}
        <div className="card-header bg-light d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            {editingUser ? "Cập nhật người dùng" : "Thêm mới người dùng"}
          </h5>
        </div>

        {/* Body của card chứa các input */}
        <div className="card-body">
          <div className="row g-3">
            {/* Input Username */}
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
                  value={formData.username} // Giá trị điều khiển từ state
                  onChange={handleChange} // Gọi handleChange khi thay đổi
                  required // Bắt buộc nhập
                />
              </div>
            </div>

            {/* Input Email */}
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

            {/* Input Password */}
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
                  // Nếu đang tạo mới thì bắt buộc nhập password,
                  // Nếu đang edit thì có thể để trống (không đổi password)
                  required={!editingUser}
                />
              </div>
            </div>

            {/* Select Role (danh sách roles từ API) */}
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

            {/* Input Avatar (file) */}
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
                  onChange={handleChange} // Gọi handleChange, lưu file vào state
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer của card chứa nút submit */}
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
