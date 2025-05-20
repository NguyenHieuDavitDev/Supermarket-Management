// Import React và các hooks cần thiết để quản lý state và side effects
import React, { useState, useEffect, useCallback } from "react";
// Import các component từ react-bootstrap để xây dựng giao diện
import {
  Table, // Bảng để hiển thị danh sách sản phẩm
  Button, // Nút bấm cho các thao tác
  Form, // Form để xử lý input tìm kiếm
  InputGroup, // Nhóm input để thêm icon tìm kiếm
  Badge, // Badge để hiển thị trạng thái hoặc số lượng
  Spinner, // Icon loading khi đang fetch dữ liệu
  Alert, // Thông báo lỗi hoặc trạng thái
  Pagination, // Phân trang cho danh sách sản phẩm
  Card, // Card để chứa input tìm kiếm
  Row, // Hàng trong layout grid
  Col, // Cột trong layout grid
  Modal, // Modal để hiển thị hình ảnh sản phẩm
} from "react-bootstrap";
// Import các icon từ react-icons/fa để sử dụng trong giao diện
import {
  FaEdit, // Icon chỉnh sửa sản phẩm
  FaTrash, // Icon xóa sản phẩm
  FaSearch, // Icon tìm kiếm
  FaSort, // Icon sắp xếp mặc định
  FaSortUp, // Icon sắp xếp tăng dần
  FaSortDown, // Icon sắp xếp giảm dần
  FaUndoAlt, // Icon khôi phục sản phẩm
  FaImage, // Icon hiển thị khi không có hình ảnh
} from "react-icons/fa";
// Import các hàm API để tương tác với backend
import { getProducts, deleteProduct, restoreProduct } from "../services/api";
// Import confirmAlert để hiển thị dialog xác nhận khi xóa sản phẩm
import { confirmAlert } from "react-confirm-alert";
// Import CSS cho dialog xác nhận
import "react-confirm-alert/src/react-confirm-alert.css";

// Hình ảnh placeholder mặc định dạng SVG base64, hiển thị khi không có hình ảnh hoặc hình ảnh lỗi
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1687617b270%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1687617b270%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2230%22%20y%3D%2255%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

// Định nghĩa component ProductList, nhận prop onEdit để xử lý chỉnh sửa sản phẩm
const ProductList = ({ onEdit }) => {
  // State lưu trữ danh sách sản phẩm, khởi tạo là mảng rỗng
  const [products, setProducts] = useState([]);
  // State hiển thị trạng thái loading, mặc định là true khi bắt đầu fetch dữ liệu
  const [loading, setLoading] = useState(true);
  // State lưu trữ thông báo lỗi nếu fetch dữ liệu thất bại
  const [error, setError] = useState("");
  // State lưu trữ từ khóa tìm kiếm, khởi tạo là chuỗi rỗng
  const [search, setSearch] = useState("");
  // State lưu trữ trang hiện tại, mặc định là trang 1
  const [currentPage, setCurrentPage] = useState(1);
  // State lưu trữ tổng số trang, khởi tạo là 0
  const [totalPages, setTotalPages] = useState(0);
  // State lưu trữ trường sắp xếp, mặc định là "createdAt" (ngày tạo)
  const [sortField, setSortField] = useState("createdAt");
  // State lưu trữ thứ tự sắp xếp (asc: tăng dần, desc: giảm dần), mặc định là "desc"
  const [sortOrder, setSortOrder] = useState("desc");
  // State quyết định hiển thị sản phẩm đã xóa hay không, mặc định là false
  const [showDeleted, setShowDeleted] = useState(false);
  // State lưu trữ sản phẩm được chọn để xem hình ảnh trong modal, mặc định là null
  const [selectedProduct, setSelectedProduct] = useState(null);
  // State điều khiển hiển thị modal hình ảnh, mặc định là false
  const [showImageModal, setShowImageModal] = useState(false);
  // State theo dõi lỗi tải hình ảnh, lưu dưới dạng object với key là imageId
  const [imageErrors, setImageErrors] = useState({});

  // Số sản phẩm trên mỗi trang, cố định là 10
  const pageSize = 10;

  // Hàm xử lý lỗi tải hình ảnh, sử dụng useCallback để memoize nhằm tối ưu hiệu suất
  const handleImageError = useCallback((imageId) => {
    // Cập nhật state imageErrors, đánh dấu imageId bị lỗi
    setImageErrors((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  }, []); // Dependency rỗng vì hàm không phụ thuộc vào state nào ngoài setImageErrors

  // Hàm xử lý URL hình ảnh, đảm bảo trả về URL hợp lệ hoặc placeholder nếu lỗi
  const getImageUrl = useCallback((url) => {
    // Nếu không có URL, trả về hình ảnh placeholder
    if (!url) return PLACEHOLDER_IMAGE;

    try {
      // Nếu URL là blob hoặc data URL (dùng cho preview hình ảnh mới), giữ nguyên
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
      }

      // Nếu URL đã là absolute (bắt đầu bằng http:// hoặc https://), giữ nguyên
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }

      // Nếu URL là relative, thêm tiền tố backend (http://localhost:3000)
      return `http://localhost:3000${url}`;
    } catch (error) {
      // Nếu có lỗi khi xử lý URL, log lỗi và trả về placeholder
      console.error("Error processing image URL:", error);
      return PLACEHOLDER_IMAGE;
    }
  }, []); // Dependency rỗng vì hàm chỉ phụ thuộc vào logic bên trong

  // Hàm render hình ảnh sản phẩm với xử lý lỗi, sử dụng useCallback để tối ưu
  const renderImage = useCallback(
    (image, productId, alt, style = {}) => {
      // Tạo imageId duy nhất dựa trên productId và image.id (nếu có)
      const imageId = `${productId}-${image?.id || "default"}`;
      // Kiểm tra xem hình ảnh có lỗi không
      const hasError = imageErrors[imageId];

      // Style mặc định cho hình ảnh
      const defaultStyle = {
        width: "50px",
        height: "50px",
        objectFit: "cover", // Đảm bảo hình ảnh vừa khung mà không bị méo
        ...style, // Ghi đè style nếu được truyền vào
      };

      // Nếu có lỗi hoặc không có URL hình ảnh, hiển thị placeholder với icon FaImage
      if (hasError || !image?.url) {
        return (
          <div
            style={{
              ...defaultStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8f9fa", // Màu nền xám nhạt
              color: "#6c757d", // Màu chữ xám
            }}
          >
            <FaImage size={20} /> {/* Icon hiển thị khi không có hình ảnh */}
          </div>
        );
      }

      // Nếu không có lỗi, render thẻ img với URL đã xử lý
      return (
        <img
          src={getImageUrl(image.url)} // Lấy URL hình ảnh từ getImageUrl
          alt={alt} // Tên thay thế cho hình ảnh
          style={defaultStyle} // Áp dụng style
          onError={() => handleImageError(imageId)} // Gọi hàm xử lý lỗi nếu tải thất bại
        />
      );
    },
    [getImageUrl, imageErrors, handleImageError] // Dependency bao gồm các hàm và state liên quan
  );

  // Hook useEffect để fetch danh sách sản phẩm từ API khi các dependency thay đổi
  useEffect(() => {
    // Hàm async để fetch dữ liệu từ API
    const fetchProducts = async () => {
      try {
        // Bật trạng thái loading trước khi fetch
        setLoading(true);
        // Gọi API getProducts với các tham số phân trang, tìm kiếm, sắp xếp
        const response = await getProducts({
          page: currentPage, // Trang hiện tại
          limit: pageSize, // Số sản phẩm trên mỗi trang
          search, // Từ khóa tìm kiếm
          sortField, // Trường sắp xếp
          sortOrder, // Thứ tự sắp xếp
          includeDeleted: showDeleted, // Hiển thị sản phẩm đã xóa hay không
        });

        // Cập nhật state products với dữ liệu từ API, mặc định là mảng rỗng nếu không có
        setProducts(response.data.products || []);
        // Cập nhật tổng số trang, mặc định là 1 nếu không có
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        // Nếu fetch thất bại, log lỗi và cập nhật state error
        console.error("Error fetching products:", error);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      } finally {
        // Tắt trạng thái loading sau khi fetch hoàn tất (thành công hay thất bại)
        setLoading(false);
      }
    };

    // Gọi hàm fetchProducts
    fetchProducts();
  }, [currentPage, search, sortField, sortOrder, showDeleted]); // Dependency: chạy lại khi các giá trị này thay đổi

  // Hàm xử lý thay đổi từ khóa tìm kiếm
  const handleSearchChange = (e) => {
    // Cập nhật state search với giá trị từ input
    setSearch(e.target.value);
    // Reset về trang 1 khi thay đổi từ khóa tìm kiếm
    setCurrentPage(1);
  };

  // Hàm xử lý sắp xếp khi click vào header của bảng
  const handleSort = (field) => {
    // Nếu trường sắp xếp hiện tại trùng với field được click
    if (sortField === field) {
      // Đổi thứ tự sắp xếp: asc -> desc hoặc desc -> asc
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nếu là trường mới, đặt field mới và sắp xếp tăng dần
      setSortField(field);
      setSortOrder("asc");
    }
    // Reset về trang 1 khi thay đổi sắp xếp
    setCurrentPage(1);
  };

  // Hàm trả về icon sắp xếp phù hợp với trạng thái hiện tại
  const getSortIcon = (field) => {
    // Nếu field không phải trường đang sắp xếp, trả về icon mặc định
    if (sortField !== field) return <FaSort />;
    // Nếu đang sắp xếp field này, trả về icon tăng dần hoặc giảm dần
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  // Hàm xử lý thay đổi trang
  const handlePageChange = (pageNumber) => {
    // Cập nhật trang hiện tại với số trang mới
    setCurrentPage(pageNumber);
  };

  // Hàm xử lý xóa sản phẩm (soft delete)
  const handleDelete = (product) => {
    // Hiển thị dialog xác nhận xóa bằng confirmAlert
    confirmAlert({
      title: "Xác nhận xóa", // Tiêu đề dialog
      message: `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`, // Nội dung thông báo
      buttons: [
        {
          label: "Có, xóa sản phẩm", // Nút xác nhận xóa
          onClick: async () => {
            try {
              // Gọi API để xóa sản phẩm
              await deleteProduct(product.id);
              // Cập nhật danh sách sản phẩm trong state mà không cần fetch lại
              const updatedProducts = products.map(
                (p) =>
                  p.id === product.id
                    ? { ...p, deletedAt: new Date().toISOString() } // Đánh dấu sản phẩm đã xóa
                    : p // Giữ nguyên các sản phẩm khác
              );
              // Cập nhật state products
              setProducts(updatedProducts);
            } catch (error) {
              // Nếu xóa thất bại, log lỗi và cập nhật state error
              console.error("Error deleting product:", error);
              setError("Không thể xóa sản phẩm. Vui lòng thử lại sau.");
            }
          },
        },
        {
          label: "Không, giữ lại", // Nút hủy xóa
          onClick: () => {}, // Không làm gì khi hủy
        },
      ],
    });
  };

  // Hàm xử lý khôi phục sản phẩm đã xóa
  const handleRestore = async (product) => {
    try {
      // Gọi API để khôi phục sản phẩm
      await restoreProduct(product.id);
      // Cập nhật danh sách sản phẩm trong state mà không cần fetch lại
      const updatedProducts = products.map(
        (p) => (p.id === product.id ? { ...p, deletedAt: null } : p) // Xóa đánh dấu đã xóa
      );
      // Cập nhật state products
      setProducts(updatedProducts);
    } catch (error) {
      // Nếu khôi phục thất bại, log lỗi và cập nhật state error
      console.error("Error restoring product:", error);
      setError("Không thể khôi phục sản phẩm. Vui lòng thử lại sau.");
    }
  };

  // Hàm hiển thị modal hình ảnh của sản phẩm
  const handleShowImages = (product) => {
    // Lưu sản phẩm được chọn vào state
    setSelectedProduct(product);
    // Hiển thị modal
    setShowImageModal(true);
  };

  // Hàm định dạng số tiền sang định dạng tiền tệ VND
  const formatCurrency = (amount) => {
    // Sử dụng Intl.NumberFormat để định dạng số thành tiền tệ Việt Nam
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Hàm render các nút phân trang
  const renderPagination = () => {
    // Nếu chỉ có 1 trang hoặc không có trang, không hiển thị phân trang
    if (totalPages <= 1) return null;

    // Mảng chứa các phần tử phân trang
    const pageItems = [];

    // Luôn hiển thị trang đầu tiên
    pageItems.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1} // Đánh dấu active nếu là trang hiện tại
        onClick={() => handlePageChange(1)} // Chuyển đến trang 1 khi click
      >
        1
      </Pagination.Item>
    );

    // Nếu trang hiện tại lớn hơn 3, hiển thị dấu chấm lửng (ellipsis)
    if (currentPage > 3) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
    }

    // Hiển thị các trang xung quanh trang hiện tại (trước và sau 1 trang)
    for (
      let page = Math.max(2, currentPage - 1);
      page <= Math.min(totalPages - 1, currentPage + 1);
      page++
    ) {
      pageItems.push(
        <Pagination.Item
          key={page}
          active={currentPage === page} // Đánh dấu active nếu là trang hiện tại
          onClick={() => handlePageChange(page)} // Chuyển đến trang tương ứng
        >
          {page}
        </Pagination.Item>
      );
    }

    // Nếu trang hiện tại cách trang cuối hơn 2 trang, hiển thị dấu chấm lửng
    if (currentPage < totalPages - 2) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
    }

    // Luôn hiển thị trang cuối nếu có hơn 1 trang
    if (totalPages > 1) {
      pageItems.push(
        <Pagination.Item
          key={totalPages}
          active={currentPage === totalPages} // Đánh dấu active nếu là trang hiện tại
          onClick={() => handlePageChange(totalPages)} // Chuyển đến trang cuối
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    // Trả về component Pagination với các nút điều hướng
    return (
      <Pagination>
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)} // Chuyển về trang trước
          disabled={currentPage === 1} // Vô hiệu hóa nếu đang ở trang 1
        />
        {pageItems} {/* Hiển thị các trang đã tạo */}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)} // Chuyển đến trang sau
          disabled={currentPage === totalPages} // Vô hiệu hóa nếu đang ở trang cuối
        />
      </Pagination>
    );
  };

  // Hàm render badge trạng thái của sản phẩm
  const renderStatusBadge = (status) => {
    let variant = "secondary"; // Màu mặc định của badge
    let text = "Không xác định"; // Văn bản mặc định

    // Xác định màu và văn bản dựa trên trạng thái
    switch (status) {
      case "active":
        variant = "success"; // Màu xanh lá
        text = "Đang bán";
        break;
      case "inactive":
        variant = "warning"; // Màu vàng
        text = "Ngừng bán";
        break;
      case "out_of_stock":
        variant = "danger"; // Màu đỏ
        text = "Hết hàng";
        break;
      default:
        break;
    }

    // Trả về badge với màu và văn bản tương ứng
    return <Badge bg={variant}>{text}</Badge>;
  };

  // Phần render giao diện của component
  return (
    <div>
      {/* Card chứa input tìm kiếm và switch hiển thị sản phẩm đã xóa */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6} lg={4}>
              {/* Input tìm kiếm với icon */}
              <InputGroup>
                <Form.Control
                  placeholder="Tìm kiếm sản phẩm..." // Placeholder cho input
                  value={search} // Giá trị hiện tại của input
                  onChange={handleSearchChange} // Xử lý khi input thay đổi
                />
                <Button variant="outline-secondary">
                  <FaSearch /> {/* Icon tìm kiếm */}
                </Button>
              </InputGroup>
            </Col>
            <Col md={6} lg={8} className="mt-3 mt-md-0 text-md-end">
              {/* Switch để bật/tắt hiển thị sản phẩm đã xóa */}
              <Form.Check
                type="switch"
                id="showDeleted"
                label="Hiển thị sản phẩm đã xóa"
                checked={showDeleted} // Trạng thái hiện tại của switch
                onChange={(e) => setShowDeleted(e.target.checked)} // Cập nhật state khi thay đổi
                className="d-inline-block me-3"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Hiển thị thông báo lỗi nếu có */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Hiển thị spinner khi đang loading */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : products.length === 0 ? (
        /* Hiển thị thông báo nếu không có sản phẩm */
        <Alert variant="info">
          Không tìm thấy sản phẩm nào
          {search && ` phù hợp với từ khóa "${search}"`}
          {showDeleted && " trong danh sách đã xóa"}
        </Alert>
      ) : (
        /* Hiển thị bảng sản phẩm nếu có dữ liệu */
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>STT</th> {/* Cột số thứ tự */}
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("name")} // Sắp xếp theo tên khi click
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Tên sản phẩm
                      {getSortIcon("name")} {/* Icon sắp xếp */}
                    </div>
                  </th>
                  <th>Hình ảnh</th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("code")} // Sắp xếp theo mã khi click
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Mã sản phẩm
                      {getSortIcon("code")}
                    </div>
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("price")} // Sắp xếp theo giá khi click
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Giá
                      {getSortIcon("price")}
                    </div>
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("quantity")} // Sắp xếp theo số lượng khi click
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      Số lượng
                      {getSortIcon("quantity")}
                    </div>
                  </th>
                  <th>Trạng thái</th>
                  <th style={{ width: "150px" }}>Thao tác</th>{" "}
                  {/* Cột thao tác */}
                </tr>
              </thead>
              <tbody>
                {/* Duyệt qua danh sách sản phẩm để render từng hàng */}
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className={product.deletedAt ? "table-danger" : ""} // Đánh dấu đỏ nếu sản phẩm đã xóa
                  >
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>{" "}
                    {/* Số thứ tự */}
                    <td>{product.name}</td> {/* Tên sản phẩm */}
                    <td>
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={() => handleShowImages(product)} // Mở modal hình ảnh khi click
                      >
                        {product.images && product.images.length > 0 ? (
                          <>
                            {/* Hiển thị hình ảnh đầu tiên */}
                            {renderImage(
                              product.images[0],
                              product.id,
                              product.name
                            )}
                            {/* Hiển thị badge nếu có nhiều hơn 1 hình ảnh */}
                            {product.images.length > 1 && (
                              <Badge bg="secondary" className="ms-1">
                                +{product.images.length - 1}
                              </Badge>
                            )}
                          </>
                        ) : (
                          // Nếu không có hình ảnh, hiển thị placeholder
                          renderImage(null, product.id, product.name)
                        )}
                      </div>
                    </td>
                    <td>{product.code}</td> {/* Mã sản phẩm */}
                    <td>{formatCurrency(product.price)}</td>{" "}
                    {/* Giá sản phẩm */}
                    <td>{product.quantity}</td> {/* Số lượng */}
                    <td>{renderStatusBadge(product.status)}</td>{" "}
                    {/* Trạng thái */}
                    <td>
                      {/* Nếu sản phẩm đã xóa, hiển thị nút khôi phục */}
                      {product.deletedAt ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="d-flex align-items-center gap-1"
                          onClick={() => handleRestore(product)} // Khôi phục sản phẩm
                        >
                          <FaUndoAlt /> Khôi phục
                        </Button>
                      ) : (
                        /* Nếu chưa xóa, hiển thị nút chỉnh sửa và xóa */
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1 mb-1"
                            onClick={() => onEdit(product)} // Gọi hàm chỉnh sửa từ prop
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="mb-1"
                            onClick={() => handleDelete(product)} // Xóa sản phẩm
                          >
                            <FaTrash />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Hiển thị thông tin trang và nút phân trang */}
          <div className="d-flex justify-content-between align-items-center my-3">
            <div>
              Trang {currentPage} / {totalPages || 1}
            </div>
            <div>{renderPagination()}</div>
          </div>
        </>
      )}

      {/* Modal hiển thị hình ảnh sản phẩm */}
      <Modal
        show={showImageModal} // Hiển thị khi showImageModal là true
        onHide={() => setShowImageModal(false)} // Ẩn modal khi click đóng
        centered // Căn giữa modal
        size="lg" // Kích thước lớn
      >
        <Modal.Header closeButton>
          <Modal.Title>Hình ảnh sản phẩm {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct?.images && selectedProduct.images.length > 0 ? (
            // Nếu có hình ảnh, hiển thị trong grid
            <Row>
              {selectedProduct.images.map((image, idx) => (
                <Col xs={12} sm={6} md={4} key={idx} className="mb-3">
                  <Card>
                    {renderImage(
                      image,
                      selectedProduct.id,
                      `${selectedProduct.name} - Hình ${idx + 1}`,
                      { height: "200px", width: "100%" } // Kích thước hình ảnh trong modal
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            // Nếu không có hình ảnh, hiển thị thông báo
            <Alert variant="info">Sản phẩm này không có hình ảnh.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowImageModal(false)} // Đóng modal
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Xuất component để sử dụng ở nơi khác
export default ProductList;
