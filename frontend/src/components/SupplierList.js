import React, { useState, useEffect } from "react";
import { getSuppliers, deleteSupplier } from "../services/api";
import SupplierForm from "./SupplierForm";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { FaPlus, FaSearch, FaPencilAlt, FaTrashAlt } from "react-icons/fa";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State cho phân trang và tìm kiếm
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  // Lấy danh sách nhà cung cấp
  const fetchSuppliers = async (
    page = 1,
    searchQuery = search,
    status = filterStatus
  ) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: searchQuery,
        ...(status !== "" && { status }),
      };

      const response = await getSuppliers(params);

      // Handle different possible response structures
      let supplierList = [];
      let totalItems = 0;
      let totalPages = 0;

      if (response.data) {
        // Direct array response
        if (Array.isArray(response.data)) {
          supplierList = response.data;
          totalItems = response.data.length;
          totalPages = 1;
        }
        // Response with suppliers property (updated format)
        else if (Array.isArray(response.data.suppliers)) {
          supplierList = response.data.suppliers;
          totalItems = response.data.totalItems || supplierList.length;
          totalPages =
            response.data.totalPages ||
            Math.ceil(totalItems / pagination.limit);
        }
        // Response with data and pagination properties (old format)
        else if (response.data.data && Array.isArray(response.data.data)) {
          supplierList = response.data.data;
          totalItems = response.data.pagination?.total || supplierList.length;
          totalPages =
            response.data.pagination?.totalPages ||
            Math.ceil(totalItems / pagination.limit);
        }
      }

      setSuppliers(supplierList);
      setPagination({
        ...pagination,
        page,
        total: totalItems,
        totalPages: totalPages,
      });

      setError("");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError("Lỗi khi tải danh sách nhà cung cấp. Vui lòng thử lại sau.");
      setSuppliers([]); // Ensure suppliers is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý thay đổi tìm kiếm
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(() => {
        fetchSuppliers(1, value, filterStatus);
      }, 500)
    );
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setFilterStatus(value);
    fetchSuppliers(1, search, value);
  };

  // Xử lý phân trang
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSuppliers(newPage);
    }
  };

  // Hiển thị form thêm mới
  const handleAddNew = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  // Hiển thị form chỉnh sửa
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  // Xác nhận xóa nhà cung cấp
  const handleDelete = (id, name) => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`,
      buttons: [
        {
          label: "Có, xóa nhà cung cấp",
          onClick: async () => {
            try {
              await deleteSupplier(id);
              // Refresh danh sách sau khi xóa
              fetchSuppliers(pagination.page);
            } catch (error) {
              console.error("Error deleting supplier:", error);
              alert(
                error.response?.data?.message || "Lỗi khi xóa nhà cung cấp"
              );
            }
          },
        },
        {
          label: "Không",
          onClick: () => {},
        },
      ],
    });
  };

  // Đóng modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Callback sau khi thêm/sửa thành công
  const handleFormSuccess = () => {
    closeModal();
    fetchSuppliers(pagination.page);
  };

  // Render phân trang
  const renderPagination = () => {
    const { page, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Nút Previous
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

    // Trang đầu tiên
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

    // Các trang ở giữa
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    // Trang cuối cùng
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

    // Nút Next
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

  // Safe access to suppliers array
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  if (loading && safeSuppliers.length === 0) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Quản lý nhà cung cấp</h5>
          <button className="btn btn-sm btn-light" onClick={handleAddNew}>
            <FaPlus className="me-1" /> Thêm mới
          </button>
        </div>
        <div className="card-body">
          {/* Thanh tìm kiếm và bộ lọc */}
          <div className="row mb-3">
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

          {/* Hiển thị thông báo lỗi nếu có */}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Danh sách nhà cung cấp */}
          {safeSuppliers.length === 0 ? (
            <div className="text-center my-3">
              <p>Không tìm thấy nhà cung cấp nào.</p>
            </div>
          ) : (
            <>
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
                    {safeSuppliers.map((supplier, index) => (
                      <tr key={supplier.id}>
                        <td>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td>
                          {supplier.logo ? (
                            <img
                              src={
                                supplier.logo.startsWith("http")
                                  ? supplier.logo
                                  : `http://localhost:3000${supplier.logo}`
                              }
                              alt={supplier.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40";
                              }}
                            />
                          ) : (
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
                        <td>{supplier.name}</td>
                        <td>{supplier.code}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.phone}</td>
                        <td>
                          <span
                            className={`badge ${
                              supplier.status ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {supplier.status ? "Hoạt động" : "Ngừng hoạt động"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => handleEdit(supplier)}
                          >
                            <FaPencilAlt />
                          </button>
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

              {/* Phân trang */}
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

      {/* Modal thêm/sửa nhà cung cấp */}
      {showModal && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSupplier
                    ? `Chỉnh sửa nhà cung cấp: ${editingSupplier.name}`
                    : "Thêm nhà cung cấp mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
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
