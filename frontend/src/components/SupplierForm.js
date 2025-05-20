import React, { useState, useEffect } from "react";
import { createSupplier, updateSupplier } from "../services/api";

const SupplierForm = ({ editingSupplier, onSuccess }) => {
  // Initial form state
  const initialFormData = {
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    taxCode: "",
    contactPerson: "",
    website: "",
    description: "",
    status: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load data when editing
  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name || "",
        code: editingSupplier.code || "",
        email: editingSupplier.email || "",
        phone: editingSupplier.phone || "",
        address: editingSupplier.address || "",
        taxCode: editingSupplier.taxCode || "",
        contactPerson: editingSupplier.contactPerson || "",
        website: editingSupplier.website || "",
        description: editingSupplier.description || "",
        status:
          editingSupplier.status === undefined ? true : editingSupplier.status,
      });

      if (editingSupplier.logo) {
        setLogoPreview(`http://localhost:3000/${editingSupplier.logo}`);
      }
    } else {
      setFormData(initialFormData);
      setLogo(null);
      setLogoPreview("");
    }
  }, [editingSupplier]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tên nhà cung cấp không được để trống";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (
      formData.website &&
      !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/.test(
        formData.website
      )
    ) {
      newErrors.website = "URL website không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create FormData object
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      if (logo) {
        data.append("logo", logo);
      }

      let response;
      if (editingSupplier) {
        response = await updateSupplier(editingSupplier.id, data);
      } else {
        response = await createSupplier(data);
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      if (error.response?.data?.errors) {
        // Map API validation errors to form fields
        const apiErrors = {};
        error.response.data.errors.forEach((err) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      }
      setSubmitError(
        error.response?.data?.message ||
          "Lỗi khi lưu nhà cung cấp. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {submitError && <div className="alert alert-danger">{submitError}</div>}

      <div className="row">
        <div className="col-md-6">
          {/* Tên nhà cung cấp */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label required">
              Tên nhà cung cấp
            </label>
            <input
              type="text"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name}</div>
            )}
          </div>

          {/* Mã nhà cung cấp */}
          <div className="mb-3">
            <label htmlFor="code" className="form-label">
              Mã nhà cung cấp
            </label>
            <input
              type="text"
              className={`form-control ${errors.code ? "is-invalid" : ""}`}
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={editingSupplier} // Không cho sửa mã khi đang chỉnh sửa
              placeholder={!editingSupplier ? "Để trống để tự động tạo mã" : ""}
            />
            {errors.code && (
              <div className="invalid-feedback">{errors.code}</div>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              Số điện thoại
            </label>
            <input
              type="text"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>

          {/* Website */}
          <div className="mb-3">
            <label htmlFor="website" className="form-label">
              Website
            </label>
            <input
              type="text"
              className={`form-control ${errors.website ? "is-invalid" : ""}`}
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
            {errors.website && (
              <div className="invalid-feedback">{errors.website}</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          {/* Địa chỉ */}
          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              Địa chỉ
            </label>
            <textarea
              className="form-control"
              id="address"
              name="address"
              rows="2"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Mã số thuế */}
          <div className="mb-3">
            <label htmlFor="taxCode" className="form-label">
              Mã số thuế
            </label>
            <input
              type="text"
              className="form-control"
              id="taxCode"
              name="taxCode"
              value={formData.taxCode}
              onChange={handleChange}
            />
          </div>

          {/* Người liên hệ */}
          <div className="mb-3">
            <label htmlFor="contactPerson" className="form-label">
              Người liên hệ
            </label>
            <input
              type="text"
              className="form-control"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </div>

          {/* Logo */}
          <div className="mb-3">
            <label htmlFor="logo" className="form-label">
              Logo
            </label>
            <input
              type="file"
              className="form-control"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleLogoChange}
            />
            <small className="form-text text-muted">
              Định dạng hỗ trợ: JPG, PNG, GIF, SVG. Tối đa 5MB.
            </small>
          </div>

          {/* Logo Preview */}
          {logoPreview && (
            <div className="mb-3">
              <label className="form-label">Preview</label>
              <div>
                <img
                  src={logoPreview}
                  alt="Preview"
                  style={{ maxHeight: "100px" }}
                  className="img-thumbnail"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mô tả */}
        <div className="col-12">
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Mô tả
            </label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        {/* Trạng thái */}
        <div className="col-12">
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="status"
              name="status"
              checked={formData.status}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="status">
              Hoạt động
            </label>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Đang xử lý...
            </>
          ) : editingSupplier ? (
            "Cập nhật"
          ) : (
            "Thêm mới"
          )}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
