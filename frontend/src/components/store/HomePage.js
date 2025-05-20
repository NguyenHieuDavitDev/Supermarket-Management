import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState để quản lý state cục bộ (featuredProducts, loading, error, retryCount)
// - useEffect để thực hiện side effects (gọi API khi component mount hoặc retry)

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container, Row, Col: bố cục lưới
// - Card: khung hiển thị nội dung (promo cards)
// - Button: nút bấm
// - Alert: hộp thông báo lỗi hoặc thông tin
// - Spinner: biểu tượng loading

import { Link } from "react-router-dom";
// Import Link để điều hướng nội bộ (client-side routing)

import Banner from "./Banner";
// Import component Banner (băng chuyền ảnh chính)

import CategoryList from "./CategoryList";
// Import component CategoryList (danh sách danh mục)

import ProductList from "./ProductList";
// Import component ProductList (danh sách sản phẩm)

import { getPublicProducts, getProducts } from "../../services/api";
// Import hai hàm gọi API:
// - getPublicProducts: lấy sản phẩm công khai (có thể có filter isFeatured)
// - getProducts: fallback lấy sản phẩm mặc định

import { FaBoxOpen, FaExclamationTriangle, FaSync } from "react-icons/fa";
// Import các icon từ thư viện react-icons/fa:
// - FaBoxOpen: icon hộp rỗng (hiển thị khi không có sản phẩm featured)
// - FaExclamationTriangle: icon cảnh báo (khi lỗi fetch)
// - FaSync: icon làm mới (retry)

const HomePage = ({ isAuthenticated, addToCart }) => {
  // Định nghĩa component HomePage, nhận hai prop:
  // - isAuthenticated: boolean, cho biết user đã đăng nhập chưa
  // - addToCart: hàm thêm sản phẩm vào giỏ (được truyền xuống ProductList)

  const [featuredProducts, setFeaturedProducts] = useState([]);
  // State chứa mảng sản phẩm nổi bật (featured)

  const [loading, setLoading] = useState(true);
  // State boolean cho biết đang ở trạng thái loading khi fetch

  const [error, setError] = useState("");
  // State chứa thông báo lỗi (nếu có) khi fetch

  const [retryCount, setRetryCount] = useState(0);
  // State đếm số lần retry để trigger useEffect chạy lại

  useEffect(() => {
    // Side effect để fetch sản phẩm nổi bật mỗi khi component mount
    // hoặc khi retryCount thay đổi

    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        // Đặt loading = true trước khi bắt đầu gọi API

        setError("");
        // Xóa thông báo lỗi cũ nếu có

        // Gọi API getPublicProducts với giới hạn 8 sản phẩm và filter isFeatured = true
        const data = await getPublicProducts({
          limit: 8,
          isFeatured: true,
        });

        // Chuẩn bị mảng products
        let products = [];
        if (data?.products && Array.isArray(data.products)) {
          // Nếu data có trường products (mảng), dùng nó
          products = data.products;
        } else if (Array.isArray(data)) {
          // Nếu API trả về trực tiếp một mảng, dùng data như mảng products
          products = data;
        }

        // Chuẩn hóa cấu trúc từng sản phẩm
        const normalizedProducts = products.map((product) => ({
          ...product,
          images: product.images || [],
          // Đảm bảo có trường images dưới dạng mảng (mặc định [])
          name: product.name || "Sản phẩm không tên",
          // Đảm bảo có trường name, nếu thiếu thì đặt mặc định
          price: product.price || 0,
          // Đảm bảo có giá, mặc định 0 nếu không có
          code: product.code || "N/A",
          // Đảm bảo có mã sản phẩm, mặc định "N/A"
          description: product.description || "Không có mô tả",
          // Đảm bảo có mô tả, mặc định "Không có mô tả"
        }));

        setFeaturedProducts(normalizedProducts);
        // Lưu mảng sản phẩm đã chuẩn hóa vào state
      } catch (error) {
        console.error("Error fetching featured products:", error);
        // In lỗi ra console để debug

        setError("Không thể tải sản phẩm nổi bật");
        // Cập nhật state error để hiển thị thông báo lỗi

        // Fallback: thử gọi getProducts thông thường
        try {
          const response = await getProducts({ limit: 8 });
          const products = response?.data?.products || [];
          // Lấy mảng products từ response.data (nếu có), nếu không có, mảng rỗng

          // Chuẩn hóa cấu trúc sản phẩm fallback
          const normalizedProducts = products.map((product) => ({
            ...product,
            images: product.images || [],
            name: product.name || "Sản phẩm không tên",
            price: product.price || 0,
            code: product.code || "N/A",
            description: product.description || "Không có mô tả",
          }));

          setFeaturedProducts(normalizedProducts);
          // Cập nhật state với mảng sản phẩm fallback

          setError("");
          // Xóa thông báo lỗi nếu fallback thành công
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
          // In lỗi fallback ra console nếu vẫn thất bại
        }
      } finally {
        setLoading(false);
        // Kết thúc loading dù thành công hay lỗi
      }
    };

    fetchFeaturedProducts();
    // Gọi hàm fetchFeaturedProducts mỗi khi useEffect chạy
  }, [retryCount]);
  // Dependency array: useEffect chạy lại khi retryCount thay đổi

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Khi người dùng nhấn “Thử lại”, tăng retryCount để trigger fetch lại
  };

  const renderFeaturedProducts = () => {
    // Hàm phụ để render phần sản phẩm nổi bật

    if (loading) {
      // Nếu đang loading, hiển thị spinner và thông báo
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          {/* Spinner loading */}
          <p className="mt-3">Đang tải sản phẩm...</p>
        </div>
      );
    }

    if (error && featuredProducts.length === 0) {
      // Nếu có lỗi và không có sản phẩm nào, hiển thị Alert lỗi và nút retry
      return (
        <Alert variant="danger" className="text-center py-4">
          <FaExclamationTriangle className="mb-3" size={40} />
          {/* Icon cảnh báo */}
          <p className="mb-3">{error}</p>
          <Button variant="outline-danger" onClick={handleRetry}>
            <FaSync className="me-2" /> Thử lại
          </Button>
        </Alert>
      );
    }

    if (featuredProducts.length === 0) {
      // Nếu không có sản phẩm nổi bật, hiển thị thông báo và nút xem tất cả
      return (
        <Alert variant="info" className="text-center py-4">
          <FaBoxOpen className="mb-3" size={40} />
          {/* Icon hộp rỗng */}
          <p className="mb-3">Hiện chưa có sản phẩm nổi bật nào</p>
          <Button as={Link} to="/store/products" variant="outline-primary">
            Xem tất cả sản phẩm
          </Button>
        </Alert>
      );
    }

    // Nếu có featuredProducts, render ProductList
    return (
      <ProductList
        products={featuredProducts}
        loading={false}
        error={""}
        isAuthenticated={isAuthenticated}
        addToCart={addToCart}
        showFilters={false}
        limit={4}
      />
      /* 
        - products: mảng sản phẩm nổi bật
        - loading, error: cài đặt sẵn false/empty vì đã xử lý ở trên
        - isAuthenticated, addToCart: prop từ HomePage truyền xuống
        - showFilters: false để ẩn phần filter
        - limit: chỉ hiển thị 4 sản phẩm trong một hàng
      */
    );
  };

  return (
    <div className="home-page">
      {/* Container chính của HomePage */}

      <Banner />
      {/* Hiển thị banner ở đầu trang */}

      <Container>
        {/* Bọc nội dung chính (Category + Featured + Promo + Info) */}

        <CategoryList />
        {/* Hiển thị danh sách danh mục */}

        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">Sản Phẩm Nổi Bật</h2>
          {/* Tiêu đề phần sản phẩm nổi bật */}

          {renderFeaturedProducts()}
          {/* Gọi hàm phụ để hiển thị tùy theo trạng thái (loading, error, no data, data) */}

          <div className="text-center mt-4">
            <Button as={Link} to="/store/products" variant="outline-primary">
              Xem tất cả sản phẩm
            </Button>
            {/* Nút dẫn tới trang xem tất cả sản phẩm */}
          </div>
        </section>

        <section className="promo-section mb-5">
          {/* Phần quảng cáo (promo) gồm hai Card hai cột */}
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              {/* Cột trái: Promo đầu tiên */}
              <Card className="text-white promo-card border-0 shadow-sm overflow-hidden">
                <div
                  className="promo-image-container"
                  style={{ height: "300px", backgroundColor: "#007bff" }}
                >
                  <Card.Img
                    src="https://via.placeholder.com/600x300/007bff/ffffff?text=Ưu+Đãi+Đặc+Biệt"
                    alt="Special Promo"
                    className="img-fluid h-100 w-100 object-fit-cover"
                    onError={(e) => {
                      // Nếu load ảnh lỗi, ẩn thẻ <img> và thêm nội dung thay thế
                      e.target.style.display = "none";
                      e.target.parentNode.classList.add(
                        "d-flex",
                        "justify-content-center",
                        "align-items-center"
                      );
                      const textDiv = document.createElement("div");
                      textDiv.innerHTML =
                        '<h3 class="text-white text-center">Ưu Đãi Đặc Biệt</h3>';
                      e.target.parentNode.appendChild(textDiv);
                    }}
                  />
                </div>
                <Card.ImgOverlay className="d-flex flex-column justify-content-center">
                  {/* Overlay chứa nội dung promo */}
                  <div className="bg-dark p-3 rounded bg-opacity-50">
                    <Card.Title className="fs-2">Ưu Đãi Đặc Biệt</Card.Title>
                    <Card.Text>
                      Giảm giá lên đến 30% cho các sản phẩm nổi bật
                    </Card.Text>
                    <Button as={Link} to="/store/products" variant="light">
                      Xem ngay
                    </Button>
                  </div>
                </Card.ImgOverlay>
              </Card>
            </Col>

            <Col md={6}>
              {/* Cột phải: Promo thứ hai */}
              <Card className="text-white promo-card border-0 shadow-sm overflow-hidden">
                <div
                  className="promo-image-container"
                  style={{ height: "300px", backgroundColor: "#28a745" }}
                >
                  <Card.Img
                    src="https://via.placeholder.com/600x300/28a745/ffffff?text=Bộ+Sưu+Tập+Mới"
                    alt="New Collection"
                    className="img-fluid h-100 w-100 object-fit-cover"
                    onError={(e) => {
                      // Xử lý lỗi load ảnh tương tự ở trên
                      e.target.style.display = "none";
                      e.target.parentNode.classList.add(
                        "d-flex",
                        "justify-content-center",
                        "align-items-center"
                      );
                      const textDiv = document.createElement("div");
                      textDiv.innerHTML =
                        '<h3 class="text-white text-center">Bộ Sưu Tập Mới</h3>';
                      e.target.parentNode.appendChild(textDiv);
                    }}
                  />
                </div>
                <Card.ImgOverlay className="d-flex flex-column justify-content-center">
                  <div className="bg-dark p-3 rounded bg-opacity-50">
                    <Card.Title className="fs-2">Bộ Sưu Tập Mới</Card.Title>
                    <Card.Text>Khám phá bộ sưu tập mới mùa hè 2023</Card.Text>
                    <Button as={Link} to="/store/products" variant="light">
                      Khám phá ngay
                    </Button>
                  </div>
                </Card.ImgOverlay>
              </Card>
            </Col>
          </Row>
        </section>

        <section className="info-section mb-5">
          {/* Phần thông tin thêm (info items) */}
          <Row className="text-center gy-4">
            <Col md={3} sm={6}>
              {/* Info item 1: Giao Hàng Miễn Phí */}
              <div className="info-item">
                <div className="info-icon mb-3">
                  <i className="fas fa-truck fa-3x text-primary"></i>
                </div>
                <h5>Giao Hàng Miễn Phí</h5>
                <p className="small text-muted">Cho đơn hàng từ 500.000đ</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              {/* Info item 2: Thanh Toán An Toàn */}
              <div className="info-item">
                <div className="info-icon mb-3">
                  <i className="fas fa-credit-card fa-3x text-primary"></i>
                </div>
                <h5>Thanh Toán An Toàn</h5>
                <p className="small text-muted">Bảo mật thông tin</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              {/* Info item 3: Đổi Trả Dễ Dàng */}
              <div className="info-item">
                <div className="info-icon mb-3">
                  <i className="fas fa-rotate-left fa-3x text-primary"></i>
                </div>
                <h5>Đổi Trả Dễ Dàng</h5>
                <p className="small text-muted">Trong vòng 30 ngày</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              {/* Info item 4: Hỗ Trợ 24/7 */}
              <div className="info-item">
                <div className="info-icon mb-3">
                  <i className="fas fa-headset fa-3x text-primary"></i>
                </div>
                <h5>Hỗ Trợ 24/7</h5>
                <p className="small text-muted">Hỗ trợ trực tuyến</p>
              </div>
            </Col>
          </Row>
        </section>
      </Container>
    </div>
  );
};

export default HomePage;
