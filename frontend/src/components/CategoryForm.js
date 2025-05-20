import React, { useState, useEffect } from "react";
// Nhập các hàm gọi API để tạo và cập nhật danh mục
import { createCategory, updateCategory } from "../services/api";

// Component CategoryForm nhận vào 3 props:
// - editingCategory: đối tượng danh mục đang chỉnh sửa (nếu có)
// - categories: danh sách tất cả danh mục (dùng để chọn danh mục cha)
// - onSuccess: callback sau khi thêm/cập nhật thành công
const CategoryForm = ({ editingCategory, categories, onSuccess }) => {
  // Định nghĩa trạng thái mặc định ban đầu của form
  const initialFormData = {
    name: "", // Tên danh mục
    description: "", // Mô tả
    status: true, // Trạng thái hiển thị (true: hiện)
    parentId: "", // ID danh mục cha (nếu có)
  };

  // Sử dụng useState để tạo các state cho form
  const [formData, setFormData] = useState(initialFormData); // Dữ liệu form
  const [image, setImage] = useState(null); // File ảnh được chọn
  const [imagePreview, setImagePreview] = useState(""); // Link preview ảnh
  const [errors, setErrors] = useState({}); // Lưu lỗi validate form
  const [loading, setLoading] = useState(false); // Trạng thái đang submit
  const [submitError, setSubmitError] = useState(""); // Lỗi khi submit

  // useEffect chạy mỗi khi editingCategory thay đổi
  useEffect(() => {
    if (editingCategory) {
      // Nếu đang edit, load dữ liệu của danh mục vào form
      setFormData({
        name: editingCategory.name || "",
        description: editingCategory.description || "",
        status:
          editingCategory.status === undefined ? true : editingCategory.status,
        parentId: editingCategory.parentId || "",
      });

      // Nếu có ảnh, tạo preview ảnh
      if (editingCategory.image) {
        setImagePreview(`http://localhost:3000/${editingCategory.image}`);
      }
    } else {
      // Nếu không phải edit, reset form về mặc định
      setFormData(initialFormData);
      setImage(null);
      setImagePreview("");
    }
  }, [editingCategory]); // Chạy lại khi editingCategory thay đổi

  // Xử lý khi người dùng thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Nếu là checkbox, lấy checked, còn lại lấy value
    const newValue = type === "checkbox" ? checked : value;

    // Cập nhật formData
    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Xóa lỗi của field đang chỉnh sửa nếu có
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Xử lý khi người dùng chọn file ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // Lưu file ảnh
      // Tạo link preview ảnh từ file tạm
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Hàm validate dữ liệu trước khi gửi lên server
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tên danh mục không được để trống";
    }

    // Không cho phép danh mục là cha của chính nó
    if (formData.parentId && formData.parentId === editingCategory?.id) {
      newErrors.parentId = "Danh mục không thể là danh mục cha của chính nó";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý khi submit form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn reload trang
    setSubmitError("");

    if (!validateForm()) {
      return; // Nếu lỗi, không tiếp tục
    }

    try {
      setLoading(true); // Bật trạng thái loading

      // Tạo FormData để gửi lên server
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("status", formData.status);

      if (formData.parentId) {
        data.append("parentId", formData.parentId);
      }

      if (image) {
        data.append("image", image);
      }

      // Nếu đang edit thì gọi API update, ngược lại gọi create
      let response;
      if (editingCategory) {
        response = await updateCategory(editingCategory.id, data);
      } else {
        response = await createCategory(data);
      }

      // Gọi callback onSuccess nếu có
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      // Nếu có lỗi, hiển thị message cụ thể hoặc mặc định
      setSubmitError(
        error.response?.data?.message ||
          "Lỗi khi lưu danh mục. Vui lòng thử lại."
      );
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  // Lọc danh mục cha hợp lệ (không bao gồm chính nó và các danh mục con)
  const getAvailableParentCategories = () => {
    if (!editingCategory) return categories;

    // Hàm đệ quy để lấy tất cả id danh mục con
    const findChildIds = (parentId) => {
      const childIds = [parentId];
      categories.forEach((cat) => {
        if (cat.parentId === parentId) {
          childIds.push(...findChildIds(cat.id)); // Đệ quy
        }
      });
      return childIds;
    };

    // Danh sách ID cần loại bỏ
    const excludeIds = editingCategory ? findChildIds(editingCategory.id) : [];
    return categories.filter((cat) => !excludeIds.includes(cat.id));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Hiển thị lỗi nếu submit thất bại */}
      {submitError && <div className="alert alert-danger">{submitError}</div>}

      {/* Trường tên danh mục */}
      <div className="mb-3">
        <label htmlFor="name" className="form-label required">
          Tên danh mục
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
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>

      {/* Trường mô tả */}
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

      {/* Trường chọn danh mục cha */}
      <div className="mb-3">
        <label htmlFor="parentId" className="form-label">
          Danh mục cha
        </label>
        <select
          className={`form-select ${errors.parentId ? "is-invalid" : ""}`}
          id="parentId"
          name="parentId"
          value={formData.parentId}
          onChange={handleChange}
        >
          <option value="">-- Không có danh mục cha --</option>
          {/* Duyệt qua danh sách danh mục cha hợp lệ */}
          {getAvailableParentCategories().map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.parentId && (
          <div className="invalid-feedback">{errors.parentId}</div>
        )}
      </div>

      {/* Trường chọn hình ảnh */}
      <div className="mb-3">
        <label htmlFor="image" className="form-label">
          Hình ảnh
        </label>
        <input
          type="file"
          className="form-control"
          id="image"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
        />
        <small className="form-text text-muted">
          Định dạng hỗ trợ: JPG, PNG, GIF. Tối đa 5MB.
        </small>
      </div>

      {/* Hiển thị ảnh preview nếu có */}
      {imagePreview && (
        <div className="mb-3">
          <label className="form-label">Preview</label>
          <div>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ maxHeight: "150px" }}
              className="img-thumbnail"
            />
          </div>
        </div>
      )}

      {/* Checkbox trạng thái danh mục */}
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
          Hiện danh mục
        </label>
      </div>

      {/* Nút submit */}
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              {/* Hiển thị spinner khi đang xử lý */}
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Đang xử lý...
            </>
          ) : editingCategory ? (
            "Cập nhật"
          ) : (
            "Thêm mới"
          )}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
