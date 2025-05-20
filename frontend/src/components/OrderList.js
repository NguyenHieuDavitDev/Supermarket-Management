import React, { useState, useEffect, useCallback } from "react";
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
import {
  getOrders,
  deleteOrder,
  restoreOrder,
  updateOrderStatus,
} from "../services/api";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Link } from "react-router-dom";

const OrderList = ({ onView, onEdit }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showDeleted, setShowDeleted] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 10;

  // Fetch orders with pagination, search, and sorting
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
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

      setOrders(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);
      setError("");
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStartDate(null);
    setEndDate(null);
    setShowDeleted(false);
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Delete order (soft delete)
  const handleDelete = (order) => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: `Bạn có chắc muốn xóa đơn hàng "${order.orderNumber}" không?`,
      buttons: [
        {
          label: "Có, xóa đơn hàng",
          onClick: async () => {
            try {
              await deleteOrder(order.id);
              if (showDeleted) {
                // Update the order's deletedAt in the list
                const updatedOrders = orders.map((o) =>
                  o.id === order.id
                    ? { ...o, deletedAt: new Date().toISOString() }
                    : o
                );
                setOrders(updatedOrders);
              } else {
                // Refresh the order list
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
          onClick: () => {},
        },
      ],
    });
  };

  // Restore order
  const handleRestore = async (order) => {
    try {
      await restoreOrder(order.id);
      if (showDeleted) {
        // Update the order's deletedAt in the list
        const updatedOrders = orders.map((o) =>
          o.id === order.id ? { ...o, deletedAt: null } : o
        );
        setOrders(updatedOrders);
      } else {
        // Refresh the order list
        fetchOrders();
      }
    } catch (error) {
      console.error("Error restoring order:", error);
      setError("Không thể khôi phục đơn hàng. Vui lòng thử lại sau.");
    }
  };

  // Update order status
  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      // Update the order's status in the list
      const updatedOrders = orders.map((o) =>
        o.id === order.id ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
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

  // Format date from date string to yyyy-MM-dd format for input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Handle date changes
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value ? new Date(e.target.value) : null);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value ? new Date(e.target.value) : null);
    setCurrentPage(1);
  };

  // Render order status badge
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

  // Render payment status badge
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

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageItems = [];

    // Always show first page
    pageItems.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );

    // Show ellipsis if needed
    if (currentPage > 3) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
    }

    // Show pages around current page
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

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
    }

    // Always show last page if there is more than 1 page
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
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {pageItems}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <div className="order-list">
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <InputGroup>
              <Form.Control
                placeholder="Tìm kiếm đơn hàng..."
                value={search}
                onChange={handleSearchChange}
              />
              <Button variant="outline-secondary">
                <FaSearch />
              </Button>
            </InputGroup>

            <Button
              variant="outline-secondary"
              className="ms-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Bộ lọc
            </Button>

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

          <div>
            <Form.Check
              type="switch"
              id="show-deleted"
              label="Hiện đơn hàng đã xóa"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1);
              }}
            />
          </div>
        </Card.Header>

        {showFilters && (
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
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

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : orders.length === 0 ? (
        <Alert variant="info">
          Không tìm thấy đơn hàng nào
          {search && ` phù hợp với từ khóa "${search}"`}
          {statusFilter && ` có trạng thái đã lọc`}
          {showDeleted && " trong danh sách đã xóa"}
        </Alert>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>STT</th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("orderNumber")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Mã đơn hàng
                      {getSortIcon("orderNumber")}
                    </div>
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("customerName")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Khách hàng
                      {getSortIcon("customerName")}
                    </div>
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("orderDate")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Ngày đặt
                      {getSortIcon("orderDate")}
                    </div>
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("grandTotal")}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Tổng tiền
                      {getSortIcon("grandTotal")}
                    </div>
                  </th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th style={{ width: "180px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={order.deletedAt ? "table-danger" : ""}
                  >
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{order.orderNumber}</td>
                    <td>
                      <div>{order.customerName}</div>
                      <small className="text-muted">
                        {order.customerPhone}
                      </small>
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{formatCurrency(order.grandTotal)}</td>
                    <td>
                      {order.deletedAt ? (
                        renderStatusBadge(order.status)
                      ) : (
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
                    <td>{renderPaymentStatusBadge(order.paymentStatus)}</td>
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
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => onView && onView(order)}
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => onEdit && onEdit(order)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </Button>
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

          <div className="d-flex justify-content-between align-items-center my-3">
            <div>
              Hiển thị {orders.length} / {totalItems} đơn hàng
            </div>
            <div>{renderPagination()}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderList;
