import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState: quản lý các biến state (orders, loading, error, v.v.)
// - useEffect: thực hiện các side effect (fetch dữ liệu khi component mount hoặc thay đổi dependency)

import {
  Container,
  Table,
  Badge,
  Button,
  Card,
  Spinner,
  Alert,
  Pagination,
  Row,
  Col,
  Form,
  InputGroup,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container: khung chứa chính
// - Table: bảng hiển thị dữ liệu đơn hàng
// - Badge: hiển thị nhãn (status, payment status)
// - Button: nút bấm
// - Card: khung chứa form lọc, tìm kiếm
// - Spinner: biểu tượng loading
// - Alert: hiển thị thông báo lỗi hoặc trạng thái
// - Pagination: phân trang
// - Row, Col: bố cục lưới cho form
// - Form, InputGroup: nhóm input + button cho tìm kiếm

import { useNavigate } from "react-router-dom";
// Import hook useNavigate để thực hiện điều hướng (programmatically) trong React Router

import { getOrders, searchOrders } from "../../services/api";
// Import hai hàm gọi API:
// - getOrders: lấy danh sách đơn hàng (có phân trang, filter status)
// - searchOrders: tìm kiếm đơn hàng theo điều kiện

import { FaSearch, FaEye, FaShoppingBag } from "react-icons/fa";
// Import các icon từ thư viện react-icons/fa:
// - FaSearch: icon kính lúp (tìm kiếm)
// - FaEye: icon mắt (xem chi tiết)
// - FaShoppingBag: icon giỏ hàng (tiêu đề)

const Orders = ({ isAuthenticated }) => {
  // Định nghĩa component Orders, nhận prop:
  // - isAuthenticated: boolean, cho biết user đã đăng nhập hay chưa

  const navigate = useNavigate();
  // Khởi tạo hook useNavigate để điều hướng trang programmatically

  // === Các biến state ===
  const [orders, setOrders] = useState([]);
  // State chứa mảng đơn hàng hiện tại

  const [loading, setLoading] = useState(true);
  // State boolean cho biết đang trong quá trình tải dữ liệu

  const [error, setError] = useState("");
  // State chứa thông báo lỗi (nếu có)

  const [searchTerm, setSearchTerm] = useState("");
  // State lưu giá trị input tìm kiếm theo mã đơn hàng

  const [totalPages, setTotalPages] = useState(1);
  // State lưu tổng số trang (tính từ API)

  const [currentPage, setCurrentPage] = useState(1);
  // State lưu trang hiện tại đang hiển thị

  const [orderStatus, setOrderStatus] = useState("");
  // State lưu giá trị filter trạng thái đơn hàng (pending, shipped, v.v.)

  // === useEffect: chạy khi component mount và khi isAuthenticated, currentPage, orderStatus thay đổi ===
  useEffect(() => {
    if (!isAuthenticated) {
      // Nếu user chưa đăng nhập, điều hướng đến trang login kèm param redirect=orders
      navigate("/login?redirect=orders");
      return;
    }

    fetchOrders();
    // Gọi hàm fetchOrders để lấy dữ liệu đơn hàng từ API
  }, [isAuthenticated, currentPage, orderStatus, navigate]);
  // Dependency array đảm bảo chạy lại khi isAuthenticated, currentPage, orderStatus thay đổi

  // === Hàm fetchOrders: lấy danh sách đơn hàng với phân trang và filter status ===
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Bật loading trước khi gọi API

      setError("");
      // Reset thông báo lỗi

      const params = {
        page: currentPage,
        limit: 10, // Giới hạn 10 đơn hàng/trang
      };

      if (orderStatus) {
        // Nếu có filter trạng thái, thêm vào params
        params.status = orderStatus;
      }

      const response = await getOrders(params);
      // Gọi API getOrders với tham số page, limit, status (nếu có)

      setOrders(response.data.orders || []);
      // Cập nhật danh sách đơn hàng (mảng orders) nhận về từ API

      setTotalPages(response.data.totalPages || 1);
      // Cập nhật tổng số trang từ API (mặc định 1 nếu không có)
    } catch (error) {
      console.error("Error fetching orders:", error);
      // In lỗi ra console để debug

      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
      // Cập nhật state error để hiển thị Alert
    } finally {
      setLoading(false);
      // Tắt loading dù thành công hay lỗi
    }
  };

  // === Hàm handleSearch: xử lý tìm kiếm đơn hàng theo searchTerm ===
  const handleSearch = async (e) => {
    e.preventDefault();
    // Ngăn form reload trang khi submit

    if (!searchTerm.trim()) {
      // Nếu searchTerm rỗng hoặc toàn khoảng trắng, gọi fetchOrders gốc
      fetchOrders();
      return;
    }

    try {
      setLoading(true);
      setError("");
      // Bật loading và reset error

      const response = await searchOrders({
        term: searchTerm,
        page: 1,
        limit: 10,
      });
      // Gọi API searchOrders với term = searchTerm, mặc định page 1 và limit 10

      setOrders(response.data.orders || []);
      // Cập nhật danh sách đơn hàng với kết quả tìm kiếm

      setTotalPages(response.data.totalPages || 1);
      // Cập nhật tổng số trang từ kết quả tìm kiếm

      setCurrentPage(1);
      // Đặt lại currentPage = 1
    } catch (error) {
      console.error("Error searching orders:", error);
      // In lỗi ra console

      setError("Không thể tìm kiếm đơn hàng. Vui lòng thử lại sau.");
      // Cập nhật thông báo lỗi tìm kiếm
    } finally {
      setLoading(false);
      // Tắt loading dù thành công hay lỗi
    }
  };

  // === Hàm xử lý thay đổi filter trạng thái ===
  const handleStatusChange = (e) => {
    setOrderStatus(e.target.value);
    setCurrentPage(1);
    // Khi thay đổi status filter, reset currentPage = 1 (nhằm fetch lại trang 1)
  };

  // === Hàm xử lý chuyển trang khi người dùng nhấn pagination ===
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Cập nhật state currentPage, trigger useEffect để fetchOrders
  };

  // === Hàm clearFilters: xóa searchTerm và orderStatus, quay về fetchOrders mặc định ===
  const clearFilters = () => {
    setSearchTerm("");
    setOrderStatus("");
    setCurrentPage(1);
    fetchOrders();
    // Reset search và filter, gọi lại fetchOrders trang 1
  };

  // === Hàm formatCurrency: định dạng số thành tiền VND ===
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
    // Sử dụng Intl.NumberFormat để format, ví dụ 1000000 -> "1.000.000 ₫"
  };

  // === Hàm formatDate: định dạng ngày giờ theo locale vi-VN ===
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    // Chuyển chuỗi date thành đối tượng Date và format
  };

  // === Hàm getStatusBadge: trả về Badge tương ứng với status đơn hàng ===
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Chờ xử lý</Badge>;
      case "processing":
        return <Badge bg="primary">Đang xử lý</Badge>;
      case "shipped":
        return <Badge bg="info">Đang giao hàng</Badge>;
      case "delivered":
        return <Badge bg="success">Đã giao hàng</Badge>;
      case "cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // === Hàm getPaymentStatusBadge: trả về Badge cho paymentStatus ===
  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge bg="success">Đã thanh toán</Badge>;
      case "pending":
        return <Badge bg="warning">Chờ thanh toán</Badge>;
      case "unpaid":
        return <Badge bg="danger">Chưa thanh toán</Badge>;
      default:
        return <Badge bg="secondary">{paymentStatus}</Badge>;
    }
  };

  // === Hàm renderPagination: xây dựng component Pagination dựa trên totalPages/currentPage ===
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    // Nếu chỉ có 1 trang, không hiển thị phân trang

    const items = [];
    // Mảng tạm để chứa các Pagination.Item và Prev/Next

    // Nút Previous
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );
    // Nếu currentPage = 1, disable Prev, ngược lại điều hướng về trang trước

    // Hiển thị trang đầu nếu hiện tại > 2
    if (currentPage > 2) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      // Nếu currentPage > 3, thêm dấu "..."
      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Hiển thị currentPage và 1 trang trước, 1 trang sau
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Hiển thị trang cuối nếu currentPage < totalPages - 1
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    // Nút Next
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );
    // Nếu currentPage = totalPages, disable Next

    return <Pagination>{items}</Pagination>;
    // Trả về component Pagination với danh sách các item
  };

  return (
    <Container className="py-5">
      {/* Container chính, padding top/bottom = 5 */}
      <h1 className="mb-4">
        <FaShoppingBag className="me-2" />
        {/* Icon giỏ hàng */}
        Lịch sử đơn hàng
      </h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {/* Nếu có error (không rỗng), hiển thị Alert màu đỏ với nội dung error */}

      <Card className="mb-4">
        {/* Card chứa form tìm kiếm và filter status */}
        <Card.Body>
          <Row>
            <Col md={7}>
              {/* Cột chứa form tìm kiếm theo mã đơn hàng */}
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Tìm kiếm theo mã đơn hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {/* Input nhận searchTerm */}
                  <Button variant="primary" type="submit">
                    <FaSearch /> Tìm
                    {/* Nút tìm kiếm, icon FaSearch */}
                  </Button>
                  <Button variant="outline-secondary" onClick={clearFilters}>
                    Xóa lọc
                    {/* Nút xóa filter (search và status) */}
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={5}>
              {/* Cột chứa dropdown filter trạng thái */}
              <Form.Group>
                <Form.Select
                  value={orderStatus}
                  onChange={handleStatusChange}
                  aria-label="Lọc theo trạng thái"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipped">Đang giao hàng</option>
                  <option value="delivered">Đã giao hàng</option>
                  <option value="cancelled">Đã hủy</option>
                </Form.Select>
                {/* Dropdown để chọn status, khi chọn gọi handleStatusChange */}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        // Nếu đang loading, hiển thị Spinner và thông báo
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        // Nếu không có đơn hàng nào
        <Alert variant="info">
          <p className="mb-0">
            {searchTerm || orderStatus
              ? "Không tìm thấy đơn hàng nào phù hợp với điều kiện tìm kiếm."
              : "Bạn chưa có đơn hàng nào. Hãy tiếp tục mua sắm!"}
          </p>
          {(searchTerm || orderStatus) && (
            // Nếu có searchTerm hoặc orderStatus, hiển thị nút "Xem tất cả đơn hàng"
            <Button variant="link" className="p-0 mt-2" onClick={clearFilters}>
              Xem tất cả đơn hàng
            </Button>
          )}
        </Alert>
      ) : (
        // Nếu có đơn hàng, hiển thị bảng và phân trang
        <>
          <div className="table-responsive">
            {/* Div bao ngoài để cho bảng cuộn ngang khi màn hình nhỏ */}
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  // Lặp qua từng order trong mảng orders
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    {/* Hiển thị mã đơn hàng */}
                    <td>{formatDate(order.createdAt)}</td>
                    {/* Hiển thị ngày đặt (được format) */}
                    <td>{formatCurrency(order.total)}</td>
                    {/* Hiển thị tổng tiền (được format) */}
                    <td>{getStatusBadge(order.status)}</td>
                    {/* Hiển thị badge trạng thái đơn */}
                    <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                    {/* Hiển thị badge trạng thái thanh toán */}
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() =>
                          navigate(`/order/success?id=${order.id}`)
                        }
                      >
                        <FaEye className="me-1" /> Xem
                        {/* Nút Xem chi tiết, icon mắt */}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-center mt-4">
            {renderPagination()}
            {/* Hiển thị phân trang nếu có nhiều hơn 1 trang */}
          </div>
        </>
      )}

      {!loading && orders.length === 0 && !searchTerm && !orderStatus && (
        // Nếu đã load xong, rỗng orders, không có filter, hiển thị nút "Tiếp tục mua sắm"
        <div className="text-center mt-4">
          <Button variant="primary" onClick={() => navigate("/")}>
            Tiếp tục mua sắm
          </Button> 
        </div>
      )}
    </Container>
  );
};

export default Orders;
