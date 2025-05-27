// Import React và các hook cần thiết
import React, { useState, useEffect } from "react";
// Import các hàm API để lấy và xóa nhà cung cấp
import { getSuppliers, deleteSupplier } from "../services/api";
// Import component form dùng để thêm/chỉnh sửa nhà cung cấp
import SupplierForm from "./SupplierForm";
// Import confirmAlert từ react-confirm-alert để hiển thị hộp thoại xác nhận
import { confirmAlert } from "react-confirm-alert";
// Import CSS của react-confirm-alert để hộp thoại hiển thị đúng kiểu
import "react-confirm-alert/src/react-confirm-alert.css";
// Import các icon từ react-icons để dùng trong giao diện
import { FaPlus, FaSearch, FaPencilAlt, FaTrashAlt } from "react-icons/fa";

// Component chính hiển thị danh sách và quản lý nhà cung cấp
const SupplierList = () => {
  // State lưu mảng nhà cung cấp lấy từ server
  const [suppliers, setSuppliers] = useState([]);
  // State lưu đối tượng nhà cung cấp đang chỉnh sửa (null nếu tạo mới)
  const [editingSupplier, setEditingSupplier] = useState(null);
  // State điều khiển hiển thị modal thêm/chỉnh sửa
  const [showModal, setShowModal] = useState(false);
  // State báo đang loading dữ liệu
  const [loading, setLoading] = useState(true);
  // State lưu thông báo lỗi khi fetch hoặc các lỗi chung
  const [error, setError] = useState("");

  // === State phân trang và tìm kiếm ===
  const [pagination, setPagination] = useState({
    page: 1, // Trang hiện tại
    limit: 10, // Số bản ghi mỗi trang
    total: 0, // Tổng số nhà cung cấp
    totalPages: 0, // Tổng số trang
  });
  // State lưu chuỗi tìm kiếm (tên hoặc mã nhà cung cấp)
  const [search, setSearch] = useState("");
  // State lưu ID timeout để debounce khi nhập tìm kiếm
  const [searchTimeout, setSearchTimeout] = useState(null);
  // State lưu trạng thái lọc (ký tự chuỗi "true"/"false" hoặc "")
  const [filterStatus, setFilterStatus] = useState("");

  //
  // Hàm fetchSuppliers: gọi API lấy danh sách nhà cung cấp với phân trang, tìm kiếm, lọc trạng thái
  //
  const fetchSuppliers = async (
    page = 1,
    searchQuery = search,
    status = filterStatus
  ) => {
    try {
      setLoading(true); // Bật trạng thái loading

      // Xây dựng params cho API: page, limit, search, status (nếu có)
      const params = {
        page,
        limit: pagination.limit,
        search: searchQuery,
        // Nếu status không phải chuỗi rỗng thì thêm vào params
        ...(status !== "" && { status }),
      };

      // Gọi API getSuppliers với params
      const response = await getSuppliers(params);

      // Các biến tạm để trích ra mảng suppliers, tổng items, tổng pages
      let supplierList = [];
      let totalItems = 0;
      let totalPages = 0;

      // Xử lý các cấu trúc response khác nhau của API
      if (response.data) {
        // 1) Nếu API trả về trực tiếp mảng trong response.data (cũ hoặc array-only)
        if (Array.isArray(response.data)) {
          supplierList = response.data;
          totalItems = response.data.length;
          totalPages = 1;
        }
        // 2) Nếu API trả về object có property "suppliers" cùng pagination (new format)
        else if (Array.isArray(response.data.suppliers)) {
          supplierList = response.data.suppliers;
          totalItems = response.data.totalItems || supplierList.length;
          totalPages =
            response.data.totalPages ||
            Math.ceil(totalItems / pagination.limit);
        }
        // 3) Nếu API trả về "data" bên trong và có "pagination" (old format)
        else if (response.data.data && Array.isArray(response.data.data)) {
          supplierList = response.data.data;
          totalItems = response.data.pagination?.total || supplierList.length;
          totalPages =
            response.data.pagination?.totalPages ||
            Math.ceil(totalItems / pagination.limit);
        }
      }

      // Cập nhật state suppliers với mảng lấy được
      setSuppliers(supplierList);
      // Cập nhật state pagination (giữ limit, thay đổi page, total, totalPages)
      setPagination({
        ...pagination,
        page,
        total: totalItems,
        totalPages: totalPages,
      });

      setError(""); // Xóa lỗi cũ nếu có
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      // Gán thông báo lỗi chung
      setError("Lỗi khi tải danh sách nhà cung cấp. Vui lòng thử lại sau.");
      // Đảm bảo suppliers luôn là mảng, kể cả khi lỗi
      setSuppliers([]);
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  // useEffect chỉ chạy một lần khi component mount để load trang 1
  useEffect(() => {
    fetchSuppliers(1);
    // Tắt cảnh báo react-hooks/exhaustive-deps vì ta chỉ muốn chạy 1 lần
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //
  // Hàm handleSearchChange: cập nhật state search và debounce trước khi fetch lại
  //
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Nếu đã có timeout trước đó, clear nó (để tránh gọi fetch quá nhanh)
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Thiết lập timeout mới 500ms, sau đó gọi fetchSuppliers với page 1
    setSearchTimeout(
      setTimeout(() => {
        fetchSuppliers(1, value, filterStatus);
      }, 500)
    );
  };

  //
  // Hàm handleStatusFilterChange: khi user chọn trạng thái từ dropdown, filter ngay
  //
  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setFilterStatus(value);
    // Khi đổi filter, luôn fetch page 1 với search cũ và filter mới
    fetchSuppliers(1, search, value);
  };

  //
  // Hàm handlePageChange: chuyển trang (newPage nằm giữa 1 và totalPages)
  //
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSuppliers(newPage);
    }
  };

  //
  // Hàm handleAddNew: bấm nút "Thêm mới", set editingSupplier = null, hiện modal
  //
  const handleAddNew = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  //
  // Hàm handleEdit: bấm nút Edit trên một dòng, set editingSupplier = supplier đó, hiện modal
  //
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  //
  // Hàm handleDelete: hiển thị hộp thoại xác nhận, nếu OK thì gọi delete API
  //
  const handleDelete = (id, name) => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`,
      buttons: [
        {
          label: "Có, xóa nhà cung cấp",
          onClick: async () => {
            try {
              // Gọi API xóa
              await deleteSupplier(id);
              // Nếu xóa thành công, refresh danh sách ở trang hiện tại
              fetchSuppliers(pagination.page);
            } catch (error) {
              console.error("Error deleting supplier:", error);
              // Nếu lỗi, hiển thị alert (có thể customize thành toast sau)
              alert(
                error.response?.data?.message || "Lỗi khi xóa nhà cung cấp"
              );
            }
          },
        },
        {
          label: "Không",
          onClick: () => {
            // Không làm gì khi bấm "Không"
          },
        },
      ],
    });
  };

  //
  // Hàm đóng modal (set showModal = false)
  //
  const closeModal = () => {
    setShowModal(false);
  };

  //
  // Callback khi form thêm/chỉnh sửa thành công: đóng modal và reload lại trang hiện tại
  //
  const handleFormSuccess = () => {
    closeModal();
    fetchSuppliers(pagination.page);
  };

  //
  // Hàm renderPagination: trả về JSX cho phân trang phía dưới bảng
  //
  const renderPagination = () => {
    const { page, totalPages } = pagination;
    // Nếu chỉ có 1 trang hoặc không có trang nào, không hiển thị phân trang
    if (totalPages <= 1) return null;

    const pages = []; // Mảng chứa các <li> cho từng trang
    const maxPagesToShow = 5; // Số trang tối đa hiển thị ở giữa (ví dụ: … 3 4 5 6 7 …)
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Điều chỉnh lại startPage nếu số trang hiển thị < maxPagesToShow
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Nút "Previous" («)
    pages.push(
      <li key="prev" className={`page-item ${page === 1 ? "disabled" : ""}`}>
        <button
          className="page-link"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          &laquo;
        </button>
      </li>
    );

    // Nếu startPage > 1, hiển thị trang 1 và dấu "..."
    if (startPage > 1) {
      pages.push(
        <li key={1} className={`page-item ${page === 1 ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(1)}>
            1
          </button>
        </li>
      );
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis1" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    // Các trang ở giữa (từ startPage đến endPage)
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    // Nếu endPage < totalPages, hiển thị dấu "..." và trang cuối
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis2" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      pages.push(
        <li
          key={totalPages}
          className={`page-item ${page === totalPages ? "active" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>
        </li>
      );
    }

    // Nút "Next" (»)
    pages.push(
      <li
        key="next"
        className={`page-item ${page === totalPages ? "disabled" : ""}`}
      >
        <button
          className="page-link"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          &raquo;
        </button>
      </li>
    );

    return (
      <nav aria-label="Phân trang">
        <ul className="pagination justify-content-center mb-0">{pages}</ul>
      </nav>
    );
  };

  //
  // safeSuppliers: đảm bảo suppliers luôn là mảng để tránh lỗi nếu API trả về undefined
  //
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  // Nếu đang loading và hiện chưa có item nào (chỉ hiển thị spinner ban đầu)
  if (loading && safeSuppliers.length === 0) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  //
  // JSX trả về giao diện chính
  //
  return (
    <div className="container-fluid">
      <div className="card">
        {/* Header của card với tiêu đề và nút "Thêm mới" */}
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Quản lý nhà cung cấp</h5>
          <button className="btn btn-sm btn-light" onClick={handleAddNew}>
            <FaPlus className="me-1" /> Thêm mới
          </button>
        </div>

        {/* Body của card chứa thanh tìm kiếm, bộ lọc, bảng danh sách, phân trang */}
        <div className="card-body">
          {/* === Thanh tìm kiếm và bộ lọc === */}
          <div className="row mb-3">
            {/* Input tìm kiếm */}
            <div className="col-md-6">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm nhà cung cấp..."
                  value={search}
                  onChange={handleSearchChange}
                />
                <button className="btn btn-outline-secondary" type="button">
                  <FaSearch />
                </button>
              </div>
            </div>
            {/* Dropdown lọc theo trạng thái */}
            <div className="col-md-6">
              <select
                className="form-select"
                value={filterStatus}
                onChange={handleStatusFilterChange}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã ngừng</option>
              </select>
            </div>
          </div>

          {/* Hiển thị thông báo lỗi nếu fetch xảy ra lỗi */}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Danh sách nhà cung cấp: nếu rỗng, hiện "Không tìm thấy" */}
          {safeSuppliers.length === 0 ? (
            <div className="text-center my-3">
              <p>Không tìm thấy nhà cung cấp nào.</p>
            </div>
          ) : (
            <>
              {/* Bảng danh sách */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Logo</th>
                      <th>Tên nhà cung cấp</th>
                      <th>Mã</th>
                      <th>Email</th>
                      <th>Điện thoại</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Lặp qua từng nhà cung cấp và hiển thị 1 hàng */}
                    {safeSuppliers.map((supplier, index) => (
                      <tr key={supplier.id}>
                        {/* STT: (page - 1) * limit + index + 1 */}
                        <td>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        {/* Logo: nếu có URL, hiển thị ảnh; nếu không, hiển thị ô "No Logo" */}
                        <td>
                          {supplier.logo ? (
                            <img
                              src={
                                // Nếu logo đã là URL đầy đủ (bắt đầu bằng http), dùng luôn
                                supplier.logo.startsWith("http")
                                  ? supplier.logo
                                  : // Ngược lại gán tiền tố localhost:3000
                                    `http://localhost:3000${supplier.logo}`
                              }
                              alt={supplier.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "contain",
                              }}
                              // Nếu load ảnh lỗi, gán ảnh placeholder 40x40
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40";
                              }}
                            />
                          ) : (
                            // Div tạm nếu không có logo
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                color: "#999",
                              }}
                            >
                              No Logo
                            </div>
                          )}
                        </td>
                        {/* Tên, mã, email, điện thoại */}
                        <td>{supplier.name}</td>
                        <td>{supplier.code}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.phone}</td>
                        {/* Trạng thái: nếu status=true, badge xanh; ngược lại badge đỏ */}
                        <td>
                          <span
                            className={`badge ${
                              supplier.status ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {supplier.status ? "Hoạt động" : "Ngừng hoạt động"}
                          </span>
                        </td>
                        {/* Thao tác: nút Edit và Delete */}
                        <td>
                          {/* Nút Edit: bấm sẽ gọi handleEdit(supplier) */}
                          <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => handleEdit(supplier)}
                          >
                            <FaPencilAlt />
                          </button>
                          {/* Nút Delete: bấm sẽ gọi handleDelete(id, name) */}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              handleDelete(supplier.id, supplier.name)
                            }
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phân trang và thông tin số lượng hiển thị */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Hiển thị {safeSuppliers.length} / {pagination.total} nhà cung
                  cấp
                </div>
                {renderPagination()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* === Modal thêm/chỉnh sửa nhà cung cấp === */}
      {showModal && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              {/* Header modal */}
              <div className="modal-header">
                <h5 className="modal-title">
                  {/* Nếu đang chỉnh sửa, hiển thị "Chỉnh sửa nhà cung cấp: Tên" */}
                  {editingSupplier
                    ? `Chỉnh sửa nhà cung cấp: ${editingSupplier.name}`
                    : "Thêm nhà cung cấp mới"}
                </h5>
                {/* Nút đóng modal */}
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              {/* Body modal: chứa SupplierForm, truyền prop editingSupplier và onSuccess */}
              <div className="modal-body">
                <SupplierForm
                  editingSupplier={editingSupplier}
                  onSuccess={handleFormSuccess}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;
