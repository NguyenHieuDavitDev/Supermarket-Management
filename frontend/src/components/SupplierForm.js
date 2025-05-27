// Import React và các hook cần thiết từ React
import React, { useState, useEffect } from "react";
// Import các hàm API để tạo hoặc cập nhật nhà cung cấp
import { createSupplier, updateSupplier } from "../services/api";

// Component SupplierForm nhận vào hai prop:
// - editingSupplier: object thông tin nhà cung cấp đang sửa (null/undefined nếu thêm mới)
// - onSuccess: callback sẽ được gọi khi tạo/cập nhật thành công (được truyền xuống từ cha)
const SupplierForm = ({ editingSupplier, onSuccess }) => {
  // Khởi tạo state lưu trữ giá trị các trường form
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
    status: true, // mặc định trạng thái "Hoạt động"
  };

  // State chính để chứa dữ liệu form (tất cả field)
  const [formData, setFormData] = useState(initialFormData);
  // State lưu file logo (File object) nếu user chọn file
  const [logo, setLogo] = useState(null);
  // State lưu chuỗi URL tạm để preview logo (dạng blob URL hoặc đường dẫn server)
  const [logoPreview, setLogoPreview] = useState("");
  // State lưu lỗi validate từng field, dạng object { fieldName: errorMessage }
  const [errors, setErrors] = useState({});
  // State báo loading khi gọi API tạo/cập nhật
  const [loading, setLoading] = useState(false);
  // State lưu thông báo lỗi chung khi submit (ngoài validate)
  const [submitError, setSubmitError] = useState("");

  //
  // 1. useEffect: Load dữ liệu khi đang chỉnh sửa (editingSupplier thay đổi)
  //
  useEffect(() => {
    if (editingSupplier) {
      // Nếu có editingSupplier, gán dữ liệu từ editingSupplier về formData
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
        // Nếu status không định nghĩa trên editingSupplier, mặc định true
        status:
          editingSupplier.status === undefined ? true : editingSupplier.status,
      });

      // Nếu editingSupplier có trường logo (đường dẫn ảnh đã lưu), hiển thị preview
      if (editingSupplier.logo) {
        // Giả sử backend trả về đường dẫn dưới dạng "logos/filename.png"
        // Ở đây gắn trước localhost:3000 để truy cập được ảnh
        setLogoPreview(`http://localhost:3000/${editingSupplier.logo}`);
      }
    } else {
      // Nếu không đang edit (tức thêm mới), reset form về giá trị ban đầu
      setFormData(initialFormData);
      setLogo(null);
      setLogoPreview("");
    }
  }, [editingSupplier]); // Chạy lại mỗi khi prop editingSupplier thay đổi

  //
  // 2. Hàm handleChange: Xử lý khi user thay đổi giá trị input/textarea/checkbox
  //
  const handleChange = (e) => {
    // Lấy name, value, type, checked từ target (input hiện tại)
    const { name, value, type, checked } = e.target;
    // Nếu là checkbox thì giá trị mới = checked, còn lại = value (chuỗi)
    const newValue = type === "checkbox" ? checked : value;

    // Cập nhật vào formData (state)
    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Nếu trước đó đã có lỗi validate ở field này, xóa lỗi (tạo trải nghiệm tốt)
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  //
  // 3. Hàm handleLogoChange: Xử lý khi user chọn file logo
  //
  const handleLogoChange = (e) => {
    // Lấy file đầu tiên trong file input
    const file = e.target.files[0];
    if (file) {
      // Lưu file vào state logo
      setLogo(file);
      // Tạo blob URL để preview (không lưu lên server ngay)
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  //
  // 4. Hàm validateForm: Kiểm tra tính hợp lệ của form trước khi submit
  //
  const validateForm = () => {
    const newErrors = {};

    // Kiểm tra tên nhà cung cấp không được để trống
    if (!formData.name.trim()) {
      newErrors.name = "Tên nhà cung cấp không được để trống";
    }

    // Nếu có nhập email, validate định dạng cơ bản
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Nếu có nhập số điện thoại, validate chỉ gồm số, dấu +, -, khoảng trắng, () và độ dài 10-15 ký tự
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    // Nếu có nhập website, validate URL cơ bản (http/https, domain, v.v.)
    if (
      formData.website &&
      !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/.test(
        formData.website
      )
    ) {
      newErrors.website = "URL website không hợp lệ";
    }

    // Gán object lỗi vào state
    setErrors(newErrors);
    // Trả về true nếu không có lỗi (newErrors rỗng)
    return Object.keys(newErrors).length === 0;
  };

  //
  // 5. Hàm handleSubmit: Xử lý khi người dùng submit form (click nút "Thêm mới"/"Cập nhật")
  //
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form submit gây reload trang
    setSubmitError(""); // Xóa lỗi chung trước đó

    // Nếu validateForm trả về false (có lỗi), không tiếp tục
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true); // Bật loading indicator

      // Tạo đối tượng FormData để gửi multipart/form-data (chứa file logo nếu có)
      const data = new FormData();
      // Duyệt từng field trong formData và append vào FormData
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      // Nếu có file logo người dùng vừa chọn, append vào FormData
      if (logo) {
        data.append("logo", logo);
      }

      let response;
      if (editingSupplier) {
        // Nếu đang ở chế độ chỉnh sửa (editingSupplier tồn tại), gọi update
        response = await updateSupplier(editingSupplier.id, data);
      } else {
        // Nếu thêm mới, gọi create
        response = await createSupplier(data);
      }

      // Nếu onSuccess được truyền vào (callback), gọi và truyền dữ liệu trả về
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      // Nếu API trả về lỗi validation ở backend (error.response.data.errors)
      if (error.response?.data?.errors) {
        const apiErrors = {};
        // mapping mảng errors từ API về object { field: message }
        error.response.data.errors.forEach((err) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      }
      // Lấy message chung nếu có, hoặc thông báo mặc định
      setSubmitError(
        error.response?.data?.message ||
          "Lỗi khi lưu nhà cung cấp. Vui lòng thử lại."
      );
    } finally {
      setLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  //
  // 6. JSX hiển thị form
  //
  return (
    <form onSubmit={handleSubmit}>
      {/* Hiển thị lỗi chung nếu submitError không rỗng */}
      {submitError && <div className="alert alert-danger">{submitError}</div>}

      <div className="row">
        {/* Cột trái: chứa các input cơ bản */}
        <div className="col-md-6">
          {/* Tên nhà cung cấp (bắt buộc) */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label required">
              Tên nhà cung cấp
            </label>
            <input
              type="text"
              // Nếu có lỗi ở field "name", thêm class is-invalid để Bootstrap hiển thị đỏ
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              id="name"
              name="name"
              value={formData.name} // Giá trị điều khiển bởi state formData.name
              onChange={handleChange} // Gọi hàm handleChange khi input thay đổi
              required // HTML validation: bắt buộc nhập
            />
            {/* Hiển thị lỗi cụ thể bên dưới nếu errors.name tồn tại */}
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
              // Nếu đang chỉnh sửa: disabled để không cho sửa mã
              disabled={editingSupplier}
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

        {/* Cột phải: chứa địa chỉ, mã số thuế, người liên hệ, logo */}
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

          {/* Upload Logo */}
          <div className="mb-3">
            <label htmlFor="logo" className="form-label">
              Logo
            </label>
            <input
              type="file"
              className="form-control"
              id="logo"
              name="logo"
              accept="image/*" // Chỉ cho chọn file ảnh
              onChange={handleLogoChange} // Gọi hàm handleLogoChange để preview
            />
            <small className="form-text text-muted">
              Định dạng hỗ trợ: JPG, PNG, GIF, SVG. Tối đa 5MB.
            </small>
          </div>

          {/* Hiển thị preview logo nếu có logoPreview */}
          {logoPreview && (
            <div className="mb-3">
              <label className="form-label">Preview</label>
              <div>
                <img
                  src={logoPreview} // Hiển thị blob URL hoặc URL server trả về
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

        {/* Checkbox Trạng thái: Hoạt động */}
        <div className="col-12">
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="status"
              name="status"
              // Checkbox checked nếu formData.status = true, unchecked nếu false
              checked={formData.status}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="status">
              Hoạt động
            </label>
          </div>
        </div>
      </div>

      {/* Nút submit nằm ở cuối form, canh phải */}
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {/* Nếu loading=true, show spinner + text "Đang xử lý..." */}
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
            // Nếu đang edit (editingSupplier tồn tại), nút hiển thị "Cập nhật"
            "Cập nhật"
          ) : (
            // Nếu thêm mới, hiển thị "Thêm mới"
            "Thêm mới"
          )}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
