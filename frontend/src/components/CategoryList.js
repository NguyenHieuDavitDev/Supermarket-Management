import React, { useState, useEffect } from "react";
// Import các hook useState, useEffect từ React để quản lý state và hiệu ứng
import { getCategories, deleteCategory } from "../services/api";
// Import hàm lấy danh mục và xóa danh mục từ API service
import CategoryForm from "./CategoryForm";
// Import component form thêm/sửa danh mục
import { confirmAlert } from "react-confirm-alert";
// Import thư viện để hiển thị hộp thoại xác nhận
import "react-confirm-alert/src/react-confirm-alert.css";
// Import style cho confirmAlert

const CategoryList = () => {
  // Khai báo component dạng function sử dụng hook

  // State lưu danh sách categories (mảng)
  const [categories, setCategories] = useState([]);

  // State lưu danh mục đang chỉnh sửa (null nếu không chỉnh sửa)
  const [editingCategory, setEditingCategory] = useState(null);

  // State để điều khiển hiển thị modal form (true: hiển thị, false: ẩn)
  const [showModal, setShowModal] = useState(false);

  // State để kiểm soát trạng thái đang tải dữ liệu (true: đang tải)
  const [loading, setLoading] = useState(true);

  // State lưu lỗi (chuỗi rỗng nếu không có lỗi)
  const [error, setError] = useState("");

  // Hàm bất đồng bộ dùng để gọi API lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true); // Đánh dấu bắt đầu trạng thái tải dữ liệu
      const response = await getCategories(); // Gọi API lấy danh mục
      setCategories(response.data); // Cập nhật state danh mục với dữ liệu nhận được
      setError(""); // Xóa lỗi nếu có trước đó
    } catch (error) {
      // Bắt lỗi khi gọi API
      console.error("Error fetching categories:", error);
      setError("Lỗi khi tải danh mục. Vui lòng thử lại sau."); // Hiển thị lỗi cho người dùng
    } finally {
      setLoading(false); // Kết thúc trạng thái tải, dù thành công hay lỗi
    }
  };

  // useEffect để gọi fetchCategories 1 lần khi component được mount (tương đương componentDidMount)
  useEffect(() => {
    fetchCategories();
  }, []); // Mảng rỗng nghĩa là chỉ chạy 1 lần lúc khởi tạo

  // Hàm xử lý khi người dùng muốn thêm danh mục mới
  const handleAddNew = () => {
    setEditingCategory(null); // Đặt không có danh mục đang chỉnh sửa (thêm mới)
    setShowModal(true); // Hiển thị modal form
  };

  // Hàm xử lý khi người dùng muốn sửa danh mục
  const handleEdit = (category) => {
    setEditingCategory(category); // Đặt danh mục đang chỉnh sửa là category được truyền vào
    setShowModal(true); // Hiển thị modal form
  };

  // Hàm xử lý xóa danh mục kèm xác nhận qua hộp thoại confirm
  const handleDelete = (id, name) => {
    confirmAlert({
      title: "Xác nhận xóa", // Tiêu đề hộp thoại
      message: `Bạn có chắc chắn muốn xóa danh mục "${name}"?`, // Nội dung xác nhận xóa
      buttons: [
        {
          label: "Có, xóa danh mục", // Nút xác nhận xóa
          onClick: async () => {
            try {
              await deleteCategory(id); // Gọi API xóa danh mục
              // Cập nhật lại state categories bằng cách lọc bỏ danh mục vừa xóa
              setCategories(categories.filter((cat) => cat.id !== id));
            } catch (error) {
              console.error("Error deleting category:", error);
              // Hiển thị lỗi cho người dùng nếu xóa thất bại
              alert(error.response?.data?.message || "Lỗi khi xóa danh mục");
            }
          },
        },
        {
          label: "Không", // Nút hủy
          onClick: () => {}, // Không làm gì khi hủy
        },
      ],
    });
  };

  // Hàm đóng modal form
  const closeModal = () => {
    setShowModal(false); // Ẩn modal
  };

  // Hàm lấy tên danh mục cha dựa vào parentId
  const getParentName = (parentId) => {
    if (!parentId) return "Không có"; // Nếu parentId null hoặc undefined thì trả về Không có
    const parent = categories.find((cat) => cat.id === parentId); // Tìm danh mục cha trong danh sách categories
    return parent ? parent.name : "Không xác định"; // Nếu tìm thấy trả về tên, nếu không thì trả về Không xác định
  };

  // Nếu đang tải dữ liệu thì hiển thị spinner loading
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // JSX trả về UI chính của component
  return (
    <div className="container-fluid mt-4">
      <div className="card shadow">
        {/* Header chứa tiêu đề và nút thêm danh mục */}
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Quản lý danh mục sản phẩm</h5>
          <button className="btn btn-light" onClick={handleAddNew}>
            <i className="fas fa-plus me-1"></i> Thêm danh mục mới
          </button>
        </div>

        <div className="card-body">
          {/* Hiển thị lỗi nếu có */}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Hiển thị modal form thêm/sửa nếu showModal=true */}
          {showModal && (
            <>
              <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      {/* Tiêu đề modal thay đổi theo việc đang sửa hay thêm */}
                      <h5 className="modal-title">
                        {editingCategory
                          ? "Cập nhật danh mục"
                          : "Thêm danh mục mới"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={closeModal} // Nút đóng modal
                      ></button>
                    </div>
                    <div className="modal-body">
                      {/* Component form thêm/sửa danh mục */}
                      <CategoryForm
                        editingCategory={editingCategory} // Truyền danh mục đang sửa nếu có
                        categories={categories} // Truyền danh sách danh mục (để chọn danh mục cha)
                        onSuccess={() => {
                          // Callback sau khi thêm/sửa thành công
                          fetchCategories(); // Tải lại danh mục từ server để cập nhật UI
                          closeModal(); // Đóng modal form
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Background mờ phía sau modal, click vào đóng modal */}
              <div
                className="modal-backdrop fade show"
                onClick={closeModal}
              ></div>
            </>
          )}

          {/* Bảng hiển thị danh mục */}
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  {/* Các cột trong bảng */}
                  <th>ID</th>
                  <th>Tên danh mục</th>
                  <th>Slug</th>
                  <th>Hình ảnh</th>
                  <th>Danh mục cha</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {/* Nếu không có danh mục nào thì hiển thị thông báo */}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Chưa có danh mục nào
                    </td>
                  </tr>
                )}

                {/* Duyệt mảng categories để hiển thị từng dòng */}
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>
                      {/* Hiển thị ảnh nếu có, nếu không thì hiển thị text */}
                      {category.image ? (
                        <img
                          src={`http://localhost:3000/${category.image}`} // Đường dẫn ảnh
                          alt={category.name}
                          height="50"
                          className="img-thumbnail"
                        />
                      ) : (
                        <span className="text-muted">Không có ảnh</span>
                      )}
                    </td>
                    {/* Hiển thị tên danh mục cha */}
                    <td>{getParentName(category.parentId)}</td>
                    <td>
                      {/* Hiển thị trạng thái với badge màu xanh nếu active, đỏ nếu inactive */}
                      <span
                        className={`badge ${
                          category.status ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {category.status ? "Hiện" : "Ẩn"}
                      </span>
                    </td>
                    <td>
                      {/* Nút chỉnh sửa */}
                      <button
                        className="btn btn-sm btn-primary me-1"
                        onClick={() => handleEdit(category)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {/* Nút xóa */}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(category.id, category.name)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
