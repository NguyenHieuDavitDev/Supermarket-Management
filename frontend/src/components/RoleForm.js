import React, { useState } from "react";
import { createRole } from "../services/api";

const RoleForm = ({ refreshRoles, closeModal }) => {
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createRole({ name });
    refreshRoles();
    closeModal();
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="mb-3">
        <label className="form-label">Tên vai trò</label>
        <input
          type="text"
          className="form-control"
          placeholder="Nhập tên vai trò"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={closeModal}
        >
          Hủy
        </button>
        <button type="submit" className="btn btn-success">
          <i className="fas fa-plus me-2"></i> Thêm
        </button>
      </div>
    </form>
  );
};

export default RoleForm;
