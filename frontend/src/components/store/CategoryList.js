import React, { useState, useEffect } from "react";
// Import React và các hook useState, useEffect để quản lý state và side effects trong component

import { Row, Col, Card, Spinner, Badge, Button, Alert } from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Row, Col: để bố cục lưới
// - Card: để hiển thị nội dung trong khung
// - Spinner: biểu tượng loading
// - Badge: hiển thị nhãn nổi
// - Button: nút bấm
// - Alert: hộp thông báo lỗi

import { Link } from "react-router-dom";
// Import Link để điều hướng nội bộ (client-side) trong ứng dụng React

import { getPublicCategories, getCategories } from "../../services/api";
// Import hai hàm gọi API:
// - getPublicCategories: lấy các danh mục công khai (giới hạn 8 mục)
// - getCategories: fallback lấy toàn bộ danh mục

import {
  FaTags,
  FaShoppingBasket,
  FaTh,
  FaExclamationTriangle,
  FaSync,
} from "react-icons/fa";
// Import các icon từ thư viện react-icons/fa:
// - FaTags: icon nhãn (tags) để hiển thị khi danh mục rỗng
// - FaShoppingBasket: icon giỏ hàng để liên kết
// - FaTh: icon lưới để tiêu đề danh mục
// - FaExclamationTriangle: icon cảnh báo khi lỗi
// - FaSync: icon làm mới (retry) khi lỗi

const CategoryList = () => {
  // Định nghĩa component CategoryList, không nhận props từ bên ngoài

  const [categories, setCategories] = useState([]);
  // State chứa mảng các danh mục (ban đầu là mảng rỗng)

  const [loading, setLoading] = useState(true);
  // State boolean cho biết đang trong quá trình tải dữ liệu

  const [error, setError] = useState("");
  // State chứa thông báo lỗi nếu có

  const [retryCount, setRetryCount] = useState(0);
  // State đếm số lần người dùng nhấn "Thử lại" để rerender useEffect

  useEffect(() => {
    // useEffect thực thi khi component mount và mỗi khi retryCount thay đổi

    const fetchCategories = async () => {
      // Hàm bất đồng bộ để lấy dữ liệu danh mục

      try {
        setLoading(true);
        // Đặt loading = true trước khi bắt đầu gọi API

        setError("");
        // Xóa bỏ lỗi cũ (nếu có)

        const data = await getPublicCategories({ limit: 8 });
        // Gọi API getPublicCategories với limit = 8

        // Extract categories from the response
        let categoryList = [];
        if (data?.categories && Array.isArray(data.categories)) {
          // Nếu data có trường categories và đó là mảng
          categoryList = data.categories;
        } else if (Array.isArray(data)) {
          // Nếu API trả về trực tiếp mảng
          categoryList = data;
        }

        // Normalize category data
        const normalizedCategories = categoryList.map((category) => ({
          ...category,
          id: category.id || category._id,
          // Đảm bảo có trường id (dùng _id nếu không có id)

          name: category.name || "Danh mục không tên",
          // Đảm bảo có trường name, nếu không đặt giá trị mặc định

          image: category.image || null,
          // Lấy image nếu có, ngược lại null
        }));

        setCategories(normalizedCategories);
        // Cập nhật state categories với dữ liệu chuẩn hóa
      } catch (error) {
        console.error("Error fetching categories:", error);
        // In lỗi ra console để debug

        setError("Không thể tải danh mục sản phẩm");
        // Cập nhật state error để hiển thị thông báo lỗi

        // Fallback to regular getCategories
        try {
          const response = await getCategories();
          // Nếu getPublicCategories lỗi, thử gọi getCategories không giới hạn

          const categoryList = response?.data || [];
          // Lấy mảng data từ response hoặc mảng rỗng nếu không có

          // Normalize category data lần nữa
          const normalizedCategories = categoryList.map((category) => ({
            ...category,
            id: category.id || category._id,
            name: category.name || "Danh mục không tên",
            image: category.image || null,
          }));

          setCategories(normalizedCategories);
          // Cập nhật categories với dữ liệu fallback

          setError("");
          // Xóa lỗi nếu fallback thành công
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
          // In lỗi fallback ra console (nếu vẫn thất bại)
        }
      } finally {
        setLoading(false);
        // Kết thúc quá trình tải, đặt loading = false
      }
    };

    fetchCategories();
    // Gọi hàm fetchCategories khi component mount hoặc retryCount thay đổi
  }, [retryCount]);
  // Dependency array chứa retryCount để cho phép retry khi giá trị này thay đổi

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Tăng retryCount lên 1 để trigger useEffect gọi lại API
  };

  // === Render loading state ===
  if (loading) {
    return (
      <div className="category-list mb-5">
        <h2 className="text-center mb-4">Danh Mục Sản Phẩm</h2>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          {/* Hiển thị spinner loading */}
          <p className="mt-2">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  // === Render error state, chỉ khi có error và categories rỗng ===
  if (error && categories.length === 0) {
    return (
      <div className="category-list mb-5">
        <h2 className="text-center mb-4">Danh Mục Sản Phẩm</h2>
        <Alert variant="danger" className="my-4 text-center py-4" role="alert">
          {/* Hiển thị hộp Alert màu đỏ chứa icon và thông báo lỗi */}
          <FaExclamationTriangle size={40} className="mb-3" />
          <p className="mb-3">{error}</p>
          <Button variant="outline-danger" onClick={handleRetry}>
            <FaSync className="me-2" /> Thử lại
            {/* Nút retry kèm icon làm mới */}
          </Button>
        </Alert>
      </div>
    );
  }

  // === Render empty state, khi không có danh mục ===
  if (!categories || categories.length === 0) {
    return (
      <div className="category-list mb-5">
        <h2 className="text-center mb-4">Danh Mục Sản Phẩm</h2>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="text-center p-5 border-0 shadow-sm">
              {/* Card hiển thị thông báo không có danh mục */}
              <Card.Body>
                <FaTags size={50} className="text-primary mb-3" />
                {/* Icon nhãn tags */}
                <Card.Title>Hiện chưa có danh mục nào</Card.Title>
                <Card.Text className="text-muted mb-4">
                  Các danh mục sản phẩm sẽ sớm được cập nhật. Bạn có thể xem tất
                  cả sản phẩm trong cửa hàng.
                </Card.Text>
                <Button
                  as={Link}
                  to="/store/products"
                  variant="primary"
                  className="d-inline-flex align-items-center"
                >
                  <FaShoppingBasket className="me-2" /> Xem tất cả sản phẩm
                  {/* Nút dẫn đến trang sản phẩm */}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // === Render danh sách danh mục khi có dữ liệu ===
  return (
    <div className="category-list mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaTh className="me-2 text-primary" /> Danh Mục Sản Phẩm
          {/* Tiêu đề kèm icon lưới */}
        </h2>
        <Link to="/store/products" className="btn btn-outline-primary btn-sm">
          Xem tất cả
          {/* Liên kết “Xem tất cả” */}
        </Link>
      </div>

      <Row xs={2} md={4} className="g-4">
        {/* Thiết lập grid: 2 cột trên mobile, 4 cột trên desktop, khoảng cách g = 4 */}
        {categories.map((category, index) => (
          <Col key={category.id || category._id || `category-${index}`}>
            {/* Mỗi Col có key duy nhất: id hoặc _id hoặc fallback index */}
            <Card
              as={Link}
              to={`/store/products?category=${
                category.id || category._id || ""
              }`}
              // Khi click cả Card sẽ dẫn đến trang sản phẩm lọc theo category
              className="h-100 text-decoration-none category-card border-0 shadow-sm transition-transform"
              // CSS: full height, không gạch chân, bo border, shadow, hiệu ứng transform
            >
              <div
                className="position-relative overflow-hidden"
                style={{ height: "150px" }}
              >
                {/* Khung ảnh: position-relative để đặt Badge absolute, overflow-hidden để cắt ảnh */}
                <Card.Img
                  variant="top"
                  src={
                    category.image ||
                    `https://via.placeholder.com/300x200?text=${encodeURIComponent(
                      category.name || "Danh mục"
                    )}`
                  }
                  // Nếu không có ảnh, dùng placeholder động chứa tên danh mục
                  alt={category.name || "Danh mục"}
                  className="category-img object-fit-cover h-100 w-100"
                  // CSS để ảnh lấp đầy 100% khung và cắt đúng tỉ lệ
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/300x200?text=${encodeURIComponent(
                      category.name || "Danh mục"
                    )}`;
                  }}
                  // Nếu load ảnh lỗi, đổi sang placeholder
                />
                {(category.productCount > 0 ||
                  category.productCount === undefined) && (
                  <Badge
                    bg="primary"
                    className="position-absolute bottom-0 end-0 mb-2 me-2"
                  >
                    {category.productCount
                      ? `${category.productCount} sản phẩm`
                      : "Xem sản phẩm"}
                    {/* Nếu có productCount, hiển thị số lượng; nếu undefined, hiển thị “Xem sản phẩm” */}
                  </Badge>
                )}
              </div>
              <Card.Body className="text-center">
                <Card.Title className="text-primary fw-bold fs-6 mb-2">
                  {category.name || "Danh mục không tên"}
                  {/* Tiêu đề danh mục: màu xanh, in đậm, font-size 6, margin-bottom 2 */}
                </Card.Title>
                {category.description && (
                  <Card.Text className="text-muted small text-truncate mb-0">
                    {category.description}
                    {/* Mô tả danh mục, màu xám, font-size nhỏ, cắt ngắn nếu quá dài */}
                  </Card.Text>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CategoryList;
