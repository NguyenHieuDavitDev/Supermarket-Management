import React, { useState, useEffect, useCallback } from "react";
// import React: thư viện chính để xây dựng UI bằng React.
// useState: Hook để khai báo state (biến lưu dữ liệu) trong functional component.
// useEffect: Hook để thực hiện side-effect (gọi API, thao tác DOM, v.v.) khi component mount hoặc khi dependencies thay đổi.
// useCallback: Hook để “memoize” (ghi nhớ) một hàm, chỉ tái tạo khi dependencies của nó thay đổi. Giúp tránh việc tái tạo hàm mỗi lần component render.

import {
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Pagination,
  Card,
  Row,
  Col,
  Dropdown,
} from "react-bootstrap";
// Table: thành phần hiển thị bảng (table) có style Bootstrap.
// Button: thành phần nút bấm có style Bootstrap.
// Form: thành phần form (thẻ <form>) của Bootstrap, bao gồm Form.Control, Form.Group, v.v.
// InputGroup: component để gom các input và nút vào cùng một dòng (ví dụ: search + nút).
// Badge: component hiển thị nhãn (badge), thường dùng để đánh dấu trạng thái với màu sắc.
// Spinner: biểu tượng loading (xoay) của Bootstrap.
// Alert: component hiển thị thông báo (alert) với nhiều loại biến thể (danger, warning, info, v.v.).
// Pagination: component hiển thị phân trang (số trang, nút Previous/Next).
// Card: component “thẻ” (card) để đóng khung bất kỳ nội dung nào, có header, body, v.v.
// Row, Col: hệ thống grid (lưới) của Bootstrap, dùng để chia bố cục thành hàng (Row) và cột (Col).
// Dropdown: component tạo dropdown (menu thả xuống), bao gồm Dropdown.Toggle và Dropdown.Menu.

import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndoAlt,
  FaFilter,
  FaCalendarAlt,
} from "react-icons/fa";
// FaEdit: icon bút chì (“edit”) từ FontAwesome.
// FaTrash: icon thùng rác (“delete”) từ FontAwesome.
// FaEye: icon con mắt (“view”) từ FontAwesome.
// FaSearch: icon kính lúp (“search”) từ FontAwesome.
// FaSort, FaSortUp, FaSortDown: các icon liên quan đến sắp xếp (sort) từ FontAwesome.
// FaUndoAlt: icon mũi tên “undo” để khôi phục (restore) từ FontAwesome.
// FaFilter: icon phễu (“filter”) từ FontAwesome.
// FaCalendarAlt: icon calendar (“date picker”) từ FontAwesome.

import {
  getOrders,
  deleteOrder,
  restoreOrder,
  updateOrderStatus,
} from "../services/api";
// getOrders: hàm API GET lấy danh sách đơn hàng (có thể kèm pagination, filter).
// deleteOrder: hàm API DELETE xóa mềm (soft delete) một đơn hàng theo id.
// restoreOrder: hàm API PATCH khôi phục (restore) đơn hàng đã xóa mềm.
// updateOrderStatus: hàm API PATCH cập nhật trạng thái đơn hàng.

import { confirmAlert } from "react-confirm-alert";
// confirmAlert: hàm hiển thị hộp thoại xác nhận (modal confirm) từ thư viện react-confirm-alert.

import "react-confirm-alert/src/react-confirm-alert.css";
// Import CSS cần thiết cho react-confirm-alert (để style hộp thoại xác nhận hiển thị đúng).

import { Link } from "react-router-dom";
// Link: component để chuyển hướng (navigate) giữa các route mà không reload trang (từ thư viện react-router-dom).

// Định nghĩa functional component OrderList, nhận vào hai prop:
// - onView: callback khi bấm nút xem chi tiết (xem đơn hàng).
// - onEdit: callback khi bấm nút chỉnh sửa đơn hàng.
const OrderList = ({ onView, onEdit }) => {
  // Khai báo state orders lưu mảng đơn hàng.
  const [orders, setOrders] = useState([]);
  // State loading báo đang load dữ liệu (fetching).
  const [loading, setLoading] = useState(true);
  // State error lưu thông báo lỗi nếu fetch hay thao tác lỗi.
  const [error, setError] = useState("");
  // State search lưu giá trị tìm kiếm theo từ khóa (orderNumber, customerName, ...).
  const [search, setSearch] = useState("");
  // State currentPage lưu trang hiện tại (bắt đầu từ 1).
  const [currentPage, setCurrentPage] = useState(1);
  // State totalPages lưu tổng số trang nhận được từ API.
  const [totalPages, setTotalPages] = useState(0);
  // State totalItems lưu tổng số đơn hàng (trước khi phân trang).
  const [totalItems, setTotalItems] = useState(0);
  // State sortField lưu trường đang sắp xếp (ví dụ: "orderDate", "grandTotal").
  const [sortField, setSortField] = useState("orderDate");
  // State sortOrder lưu chiều sắp xếp: "asc" (tăng dần) hoặc "desc" (giảm dần).
  const [sortOrder, setSortOrder] = useState("desc");
  // State showDeleted: boolean, true => hiển thị cả đơn đã xóa (deletedAt != null).
  const [showDeleted, setShowDeleted] = useState(false);
  // State statusFilter lưu trạng thái lọc (pending/processing/completed/cancelled/refunded).
  const [statusFilter, setStatusFilter] = useState("");
  // State startDate và endDate lưu giá trị ngày lọc (Date object).
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  // State showFilters: boolean, true => hiển thị khu vực bộ lọc nâng cao.
  const [showFilters, setShowFilters] = useState(false);

  // Biến pageSize cố định số dòng hiển thị mỗi trang (10).
  const pageSize = 10;

  //
  // Hàm fetchOrders: gọi API getOrders với params pagination, search, sort, filter
  //   Dùng useCallback để ghi nhớ function và chỉ tái tạo khi dependencies thay đổi.
  //
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true); // Bật loading khi bắt đầu gọi API

      // Gọi API getOrders với object params:
      // page: currentPage
      // limit: pageSize
      // search: search (từ state)
      // sortField: trường sắp xếp
      // sortOrder: chiều sắp xếp
      // includeDeleted: showDeleted (true/false)
      // status: statusFilter
      // startDate/endDate: chuyển Date object sang chuỗi YYYY-MM-DD hoặc "" nếu null
      const response = await getOrders({
        page: currentPage,
        limit: pageSize,
        search,
        sortField,
        sortOrder,
        includeDeleted: showDeleted,
        status: statusFilter,
        startDate: startDate ? startDate.toISOString().split("T")[0] : "",
        endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      });

      // Nếu response.data.orders là mảng, gán vào state orders, ngược lại gán [].
      setOrders(response.data.orders || []);
      // Gán totalPages, totalItems từ response.data (hoặc mặc định)
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);
      setError(""); // Reset error nếu trước đó có lỗi
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false); // Tắt loading dù thành công hay thất bại
    }
  }, [
    currentPage,
    search,
    sortField,
    sortOrder,
    showDeleted,
    statusFilter,
    startDate,
    endDate,
  ]);
  // Dependencies: khi một trong các state này thay đổi, fetchOrders sẽ được tái tạo

  // useEffect: gọi fetchOrders lần đầu khi component mount, và mỗi khi fetchOrders (dependencies) thay đổi
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  //
  // Hàm handleSearchChange: khi user gõ vào ô tìm kiếm
  //
  const handleSearchChange = (e) => {
    setSearch(e.target.value); // Cập nhật state search
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
  };

  //
  // Hàm clearFilters: xóa hết các bộ lọc (search, statusFilter, date, showDeleted), reset currentPage
  //
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStartDate(null);
    setEndDate(null);
    setShowDeleted(false);
    setCurrentPage(1);
  };

  //
  // Hàm handleSort: khi user bấm vào tiêu đề cột (sortable), field là tên trường (string)
  //
  const handleSort = (field) => {
    if (sortField === field) {
      // Nếu đang sắp xếp theo cùng field, chỉ đổi chiều sortOrder
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nếu đổi sang field khác, đặt sortField = field, sortOrder mặc định "asc"
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset về trang 1 khi thay đổi sắp xếp
  };

  //
  // Hàm getSortIcon: trả về icon tương ứng dựa trên sortField và sortOrder
  //
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    // Nếu field đang được sort, hiển thị FaSortUp (asc) hoặc FaSortDown (desc)
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  //
  // Hàm handlePageChange: khi user chọn trang mới, pageNumber là số trang mới (1-based)
  //
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  //
  // Hàm handleDelete: xóa (soft delete) một đơn hàng
  //   order: object đơn hàng, chứa order.id, order.orderNumber, order.deletedAt, v.v.
  //
  const handleDelete = (order) => {
    // Hiển thị hộp thoại xác nhận bằng confirmAlert
    confirmAlert({
      title: "Xác nhận xóa",
      message: `Bạn có chắc muốn xóa đơn hàng "${order.orderNumber}" không?`,
      buttons: [
        {
          label: "Có, xóa đơn hàng",
          onClick: async () => {
            try {
              await deleteOrder(order.id); // Gọi API xóa mềm

              if (showDeleted) {
                // Nếu đang hiển thị cả đơn đã xóa (showDeleted = true),
                // cập nhật cột deletedAt của order đó trong mảng orders bằng ngay hiện tại
                const updatedOrders = orders.map((o) =>
                  o.id === order.id
                    ? { ...o, deletedAt: new Date().toISOString() }
                    : o
                );
                setOrders(updatedOrders);
              } else {
                // Nếu đang hiển thị chỉ đơn chưa xóa, fetch lại danh sách
                fetchOrders();
              }
            } catch (error) {
              console.error("Error deleting order:", error);
              setError("Không thể xóa đơn hàng. Vui lòng thử lại sau.");
            }
          },
        },
        {
          label: "Không, giữ lại",
          onClick: () => {
            // Không làm gì nếu user chọn “Không”
          },
        },
      ],
    });
  };

  //
  // Hàm handleRestore: khôi phục một đơn hàng đã xóa (restore)
  //
  const handleRestore = async (order) => {
    try {
      await restoreOrder(order.id); // Gọi API khôi phục

      if (showDeleted) {
        // Nếu đang hiển thị trang showDeleted, cập nhật deletedAt = null
        const updatedOrders = orders.map((o) =>
          o.id === order.id ? { ...o, deletedAt: null } : o
        );
        setOrders(updatedOrders);
      } else {
        // Nếu đang hiển thị trang bình thường, fetch lại danh sách
        fetchOrders();
      }
    } catch (error) {
      console.error("Error restoring order:", error);
      setError("Không thể khôi phục đơn hàng. Vui lòng thử lại sau.");
    }
  };

  //
  // Hàm handleStatusChange: cập nhật trạng thái đơn hàng (pending, processing, completed, cancelled, refunded)
  //   order: object đơn hàng, newStatus: string trạng thái mới
  //
  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus); // Gọi API cập nhật status

      // Cập nhật state orders: với mỗi order, nếu id khớp thì gán status = newStatus
      const updatedOrders = orders.map((o) =>
        o.id === order.id ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.");
    }
  };

  //
  // Hàm formatCurrency: định dạng số thành chuỗi tiền tệ (VND)
  //
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  //
  // Hàm formatDate: định dạng dateString (ISO hoặc chuỗi date) thành định dạng DD/MM/YYYY HH:mm theo locale "vi-VN"
  //
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  //
  // Hàm formatDateForInput: chuyển Date object hoặc chuỗi date thành chuỗi "YYYY-MM-DD" dùng cho <input type="date">
  //
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  //
  // Hàm handleStartDateChange: khi user chọn ngày bắt đầu lọc
  //
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value ? new Date(e.target.value) : null);
    setCurrentPage(1);
  };

  //
  // Hàm handleEndDateChange: khi user chọn ngày kết thúc lọc
  //
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value ? new Date(e.target.value) : null);
    setCurrentPage(1);
  };

  //
  // Hàm renderStatusBadge: trả về component <Badge> với màu và text tùy trạng thái order
  //
  const renderStatusBadge = (status) => {
    let variant = "secondary";
    let text = "Không xác định";

    switch (status) {
      case "pending":
        variant = "warning";
        text = "Chờ xử lý";
        break;
      case "processing":
        variant = "info";
        text = "Đang xử lý";
        break;
      case "completed":
        variant = "success";
        text = "Hoàn thành";
        break;
      case "cancelled":
        variant = "danger";
        text = "Đã hủy";
        break;
      case "refunded":
        variant = "dark";
        text = "Đã hoàn tiền";
        break;
      default:
        break;
    }

    return <Badge bg={variant}>{text}</Badge>;
  };

  //
  // Hàm renderPaymentStatusBadge: tương tự renderStatusBadge nhưng cho paymentStatus
  //
  const renderPaymentStatusBadge = (status) => {
    let variant = "secondary";
    let text = "Không xác định";

    switch (status) {
      case "unpaid":
        variant = "danger";
        text = "Chưa thanh toán";
        break;
      case "partially_paid":
        variant = "warning";
        text = "Thanh toán một phần";
        break;
      case "paid":
        variant = "success";
        text = "Đã thanh toán";
        break;
      default:
        break;
    }

    return <Badge bg={variant}>{text}</Badge>;
  };

  //
  // Hàm renderPagination: hiển thị component <Pagination> với nút số, ellipses, nút Previous/Next
  //
  const renderPagination = () => {
    if (totalPages <= 1) return null; // Nếu chỉ có 1 trang, không hiển thị phân trang

    const pageItems = [];

    // Luôn luôn show trang 1
    pageItems.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );

    // Nếu currentPage > 3, show ellipsis sau nút trang 1
    if (currentPage > 3) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
    }

    // Show các trang xung quanh currentPage (từ max(2, currentPage - 1) đến min(totalPages - 1, currentPage + 1))
    for (
      let page = Math.max(2, currentPage - 1);
      page <= Math.min(totalPages - 1, currentPage + 1);
      page++
    ) {
      pageItems.push(
        <Pagination.Item
          key={page}
          active={currentPage === page}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Nếu currentPage < totalPages - 2, hiển thị ellipsis trước nút trang cuối
    if (currentPage < totalPages - 2) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
    }

    // Luôn show nút trang cuối (nếu tổng pages > 1)
    if (totalPages > 1) {
      pageItems.push(
        <Pagination.Item
          key={totalPages}
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination>
        {/* Nút Previous */}
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {pageItems}
        {/* Nút Next */}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // ——————————————————————————————————————————————————————————————————————
  // JSX trả về giao diện chính của OrderList
  // ——————————————————————————————————————————————————————————————————————
  return (
    <div className="order-list">
      {/* Nếu có error state, hiển thị <Alert variant="danger"> */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Card chứa phần header: tìm kiếm, nút filter, switch hiển thị đơn đã xóa */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {/* InputGroup chứa ô search + nút search */}
            <InputGroup>
              <Form.Control
                placeholder="Tìm kiếm đơn hàng..."
                value={search} // Giá trị ô search được điều khiển bởi state search
                onChange={handleSearchChange} // Khi thay đổi, gọi handleSearchChange
              />
              <Button variant="outline-secondary">
                <FaSearch />
              </Button>
            </InputGroup>

            {/* Nút bật/tắt bộ lọc (showFilters) */}
            <Button
              variant="outline-secondary"
              className="ms-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Bộ lọc
            </Button>

            {/* Nếu có ít nhất 1 bộ lọc đang áp dụng (search, statusFilter, startDate, endDate, showDeleted),
                hiển thị nút Xóa bộ lọc */}
            {(search ||
              statusFilter ||
              startDate ||
              endDate ||
              showDeleted) && (
              <Button
                variant="outline-danger"
                className="ms-2"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Switch “Hiện đơn hàng đã xóa” */}
          <div>
            <Form.Check
              type="switch"
              id="show-deleted"
              label="Hiện đơn hàng đã xóa"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1); // Mỗi khi đổi showDeleted, reset page về 1
              }}
            />
          </div>
        </Card.Header>

        {/* Nếu showFilters = true, hiển thị thêm các control lọc khác */}
        {showFilters && (
          <Card.Body>
            <Row>
              {/* Cột chọn trạng thái (statusFilter) */}
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset page sau khi đổi filter
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="refunded">Đã hoàn tiền</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Cột chọn ngày bắt đầu (startDate) */}
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Từ ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={formatDateForInput(startDate)}
                    onChange={handleStartDateChange}
                  />
                </Form.Group>
              </Col>

              {/* Cột chọn ngày kết thúc (endDate) */}
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Đến ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={formatDateForInput(endDate)}
                    onChange={handleEndDateChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>

      {/* Nếu đang loading (fetchOrders đang chạy) */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : // Nếu không loading và orders rỗng
      orders.length === 0 ? (
        <Alert variant="info">
          Không tìm thấy đơn hàng nào
          {search && ` phù hợp với từ khóa "${search}"`}
          {statusFilter && ` có trạng thái đã lọc`}
          {showDeleted && " trong danh sách đã xóa"}
        </Alert>
      ) : (
        // Nếu có orders, hiển thị bảng và phân trang
        <>
          {/* Bảng danh sách đơn hàng */}
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  {/* Cột STT */}
                  <th style={{ width: "50px" }}>STT</th>

                  {/* Cột Mã đơn hàng (sortable) */}
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("orderNumber")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Mã đơn hàng
                      {getSortIcon("orderNumber")}
                    </div>
                  </th>

                  {/* Cột Khách hàng (sortable) */}
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("customerName")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Khách hàng
                      {getSortIcon("customerName")}
                    </div>
                  </th>

                  {/* Cột Ngày đặt (sortable) */}
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("orderDate")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Ngày đặt
                      {getSortIcon("orderDate")}
                    </div>
                  </th>

                  {/* Cột Tổng tiền (sortable) */}
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("grandTotal")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Tổng tiền
                      {getSortIcon("grandTotal")}
                    </div>
                  </th>

                  {/* Cột Trạng thái */}
                  <th>Trạng thái</th>

                  {/* Cột Thanh toán */}
                  <th>Thanh toán</th>

                  {/* Cột Thao tác */}
                  <th style={{ width: "180px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {/* Lặp qua mảng orders để hiển thị từng dòng */}
                {orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={order.deletedAt ? "table-danger" : ""}
                    // Nếu order.deletedAt không null => áp class table-danger (nền đỏ nhạt)
                  >
                    {/* Cột STT: (currentPage - 1) * pageSize + index + 1 */}
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>

                    {/* Cột orderNumber */}
                    <td>{order.orderNumber}</td>

                    {/* Cột Khách hàng và số điện thoại */}
                    <td>
                      <div>{order.customerName}</div>
                      <small className="text-muted">
                        {order.customerPhone}
                      </small>
                    </td>

                    {/* Cột Ngày đặt: formatDate */}
                    <td>{formatDate(order.orderDate)}</td>

                    {/* Cột Tổng tiền: formatCurrency */}
                    <td>{formatCurrency(order.grandTotal)}</td>

                    {/* Cột Trạng thái: nếu order.deletedAt thì chỉ render badge; ngược lại render dropdown để thay đổi status */}
                    <td>
                      {order.deletedAt ? (
                        // Nếu đã xóa (deletedAt != null), chỉ show badge trạng thái
                        renderStatusBadge(order.status)
                      ) : (
                        // Nếu chưa xóa, cho phép chọn trạng thái bằng dropdown
                        <Dropdown>
                          <Dropdown.Toggle
                            variant={
                              order.status === "pending"
                                ? "warning"
                                : order.status === "processing"
                                ? "info"
                                : order.status === "completed"
                                ? "success"
                                : order.status === "cancelled"
                                ? "danger"
                                : "secondary"
                            }
                            size="sm"
                            id={`dropdown-status-${order.id}`}
                          >
                            {/* 
                              Hiển thị text tương ứng với order.status:
                              - pending => "Chờ xử lý"
                              - processing => "Đang xử lý"
                              - completed => "Hoàn thành"
                              - cancelled => "Đã hủy"
                              - refunded => "Đã hoàn tiền"
                            */}
                            {order.status === "pending"
                              ? "Chờ xử lý"
                              : order.status === "processing"
                              ? "Đang xử lý"
                              : order.status === "completed"
                              ? "Hoàn thành"
                              : order.status === "cancelled"
                              ? "Đã hủy"
                              : order.status === "refunded"
                              ? "Đã hoàn tiền"
                              : "Không xác định"}
                          </Dropdown.Toggle>

                          {/* Menu dropdown chứa các lựa chọn trạng thái */}
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() =>
                                handleStatusChange(order, "pending")
                              }
                              active={order.status === "pending"}
                            >
                              Chờ xử lý
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleStatusChange(order, "processing")
                              }
                              active={order.status === "processing"}
                            >
                              Đang xử lý
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleStatusChange(order, "completed")
                              }
                              active={order.status === "completed"}
                            >
                              Hoàn thành
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleStatusChange(order, "cancelled")
                              }
                              active={order.status === "cancelled"}
                            >
                              Đã hủy
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleStatusChange(order, "refunded")
                              }
                              active={order.status === "refunded"}
                            >
                              Đã hoàn tiền
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </td>

                    {/* Cột Thanh toán: show badge status thanh toán */}
                    <td>{renderPaymentStatusBadge(order.paymentStatus)}</td>

                    {/* Cột Thao tác: 
                        - Nếu order.deletedAt (đã xóa): hiển thị nút Khôi phục (restore)
                        - Nếu chưa xóa: hiển thị nút Xem (onView), Sửa (onEdit), Xóa (handleDelete)
                    */}
                    <td>
                      {order.deletedAt ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="d-flex align-items-center gap-1"
                          onClick={() => handleRestore(order)}
                        >
                          <FaUndoAlt /> Khôi phục
                        </Button>
                      ) : (
                        <div className="d-flex gap-1">
                          {/* Nút Xem chi tiết: gọi onView(order) nếu onView tồn tại */}
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => onView && onView(order)}
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </Button>

                          {/* Nút Chỉnh sửa: gọi onEdit(order) nếu onEdit tồn tại */}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => onEdit && onEdit(order)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </Button>

                          {/* Nút Xóa: gọi handleDelete(order) */}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(order)}
                            title="Xóa"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Phân trang và hiển thị số lượng */}
          <div className="d-flex justify-content-between align-items-center my-3">
            {/* Hiển thị số dòng hiện tại và tổng số items */}
            <div>
              Hiển thị {orders.length} / {totalItems} đơn hàng
            </div>
            {/* Gọi renderPagination() để hiển thị component phân trang */}
            <div>{renderPagination()}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderList;
