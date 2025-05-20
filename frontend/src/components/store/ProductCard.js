import React, { useState } from "react";
// Import React và hook useState để quản lý state cục bộ (ví dụ loading, imageError)

import { Card, Button, Badge } from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Card: khung chứa nội dung sản phẩm
// - Button: nút bấm
// - Badge: hiển thị nhãn như “Nổi bật”, “Hết hàng”

import { Link, useNavigate } from "react-router-dom";
// Import Link để điều hướng client-side, useNavigate để điều hướng programmatically

import { FaShoppingCart, FaEye, FaImage } from "react-icons/fa";
// Import các icon từ thư viện react-icons/fa:
// - FaShoppingCart: icon giỏ hàng
// - FaEye: icon xem chi tiết
// - FaImage: icon hiển thị khi hình ảnh sản phẩm lỗi

import { toast } from "react-toastify";
// Import toast để hiển thị thông báo (pop-up) khi cần (ví dụ: yêu cầu đăng nhập để thêm hàng)

const ProductCard = ({ product, addToCart, isAuthenticated }) => {
  // Định nghĩa component ProductCard, nhận các prop:
  // - product: object chứa thông tin chi tiết của sản phẩm
  // - addToCart: hàm do component cha truyền vào để thêm sản phẩm vào giỏ
  // - isAuthenticated: boolean, true nếu người dùng đã đăng nhập

  const [loading, setLoading] = useState(false);
  // State loading để disable nút “Thêm vào giỏ” khi đang xử lý

  const [imageError, setImageError] = useState(false);
  // State imageError để chuyển sang placeholder khi load ảnh bị lỗi

  const navigate = useNavigate();
  // Khởi tạo hook useNavigate để điều hướng trang khi cần

  // Đảm bảo productId tồn tại: dùng product.id (nếu có) hoặc fallback sang product._id
  const productId = product?.id || product?._id;

  // Hàm getProductImage trả về URL hình ảnh sản phẩm hoặc placeholder khi lỗi
  const getProductImage = () => {
    // Nếu đã gặp lỗi load ảnh, trả về placeholder cố định có tên sản phẩm
    if (imageError) {
      return `https://via.placeholder.com/300x300?text=${encodeURIComponent(
        product?.name || "Sản phẩm"
      )}`;
    }

    // Nếu product.images không tồn tại, không phải mảng, hoặc mảng rỗng => placeholder
    if (
      !product?.images ||
      !Array.isArray(product.images) ||
      product.images.length === 0
    ) {
      return `https://via.placeholder.com/300x300?text=${encodeURIComponent(
        product?.name || "Sản phẩm"
      )}`;
    }

    // Nếu có mảng hình, tìm ảnh mặc định (isDefault = true), hoặc fallback ảnh đầu tiên
    const defaultImage = product.images.find((img) => img.isDefault);
    const imgUrl = defaultImage?.url || product.images[0]?.url;

    // Kiểm tra xem URL có bắt đầu bằng http hoặc https không,
    // nếu không hợp lệ hoặc undefined => placeholder
    if (
      !imgUrl ||
      (!imgUrl.startsWith("http://") && !imgUrl.startsWith("https://"))
    ) {
      return `https://via.placeholder.com/300x300?text=${encodeURIComponent(
        product?.name || "Sản phẩm"
      )}`;
    }

    // Nếu URL hợp lệ, trả về URL gốc
    return imgUrl;
  };

  // Hàm formatCurrency: định dạng số sang chuỗi VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Hàm xử lý khi load ảnh bị lỗi, set imageError = true
  const handleImageError = () => {
    setImageError(true);
  };

  // Hàm xử lý khi người dùng nhấn “Thêm vào giỏ”
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Ngăn cản sự kiện click lan lên Link cha (tránh điều hướng khi ấn nút)

    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, hiển thị toast thông báo và điều hướng đến trang login
      toast.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      navigate("/login");
      return;
    }

    if (!product) {
      // Nếu toàn bộ product null/undefined, hiển thị lỗi
      toast.error("Không thể thêm sản phẩm vào giỏ hàng");
      return;
    }

    setLoading(true);
    // Bật loading để disable nút khi xử lý

    try {
      addToCart(product, 1);
      // Gọi hàm addToCart truyền từ component cha, thêm 1 sản phẩm vào giỏ
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Không thể thêm sản phẩm vào giỏ hàng");
    } finally {
      setLoading(false);
      // Tắt loading dù thành công hay lỗi
    }
  };

  // Nếu product null hoặc undefined, render card placeholder
  if (!product) {
    return (
      <Card className="h-100 product-card shadow-sm border-0 mb-4 transition-transform">
        {/* Khung Card trống với thông báo “Sản phẩm không tồn tại” */}
        <div
          className="product-image-container position-relative overflow-hidden"
          style={{ height: "200px" }}
        >
          <div className="d-flex align-items-center justify-content-center h-100 bg-light">
            <FaImage size={40} className="text-muted" />
          </div>
        </div>
        <Card.Body>
          <Card.Title className="text-truncate">
            Sản phẩm không tồn tại
          </Card.Title>
          <Card.Text className="text-muted small">
            Sản phẩm này có thể đã bị xóa hoặc tạm ngừng kinh doanh
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // Kiểm tra xem sản phẩm có còn sẵn hay đã ngừng kinh doanh
  const isProductAvailable =
    product.quantity > 0 && !product.deletedAt && product.status !== "inactive";

  return (
    <Card className="h-100 product-card shadow-sm border-0 mb-4 transition-transform">
      <Link
        to={productId ? `/store/product/${productId}` : "#"}
        className="text-decoration-none text-reset"
        // Khi click vào toàn bộ card (ngoại trừ nút), điều hướng đến trang chi tiết
        onClick={(e) => {
          if (!productId) {
            // Nếu productId không hợp lệ, ngăn điều hướng và hiển thị cảnh báo
            e.preventDefault();
            toast.warning("Không thể xem chi tiết sản phẩm này");
          }
        }}
      >
        <div
          className="product-image-container position-relative overflow-hidden"
          style={{ height: "200px", backgroundColor: "#f8f9fa" }}
        >
          {imageError ? (
            // Nếu lỗi load ảnh, hiển thị placeholder có tên sản phẩm
            <div className="d-flex align-items-center justify-content-center h-100 bg-light">
              <FaImage size={40} className="text-muted me-2" />
              <span className="text-muted">{product.name || "Sản phẩm"}</span>
            </div>
          ) : (
            // Nếu không lỗi, hiển thị ảnh gốc
            <Card.Img
              variant="top"
              src={getProductImage()}
              alt={product.name || "Sản phẩm không tên"}
              className="product-image object-fit-cover h-100 w-100"
              onError={handleImageError}
              loading="lazy"
            />
          )}

          {/* Nếu status = "inactive", hiển thị badge "Ngừng kinh doanh" */}
          {product.status === "inactive" && (
            <Badge bg="secondary" className="position-absolute top-0 end-0 m-2">
              Ngừng kinh doanh
            </Badge>
          )}

          {/* Nếu quantity <= 0, hiển thị badge "Hết hàng" */}
          {(product.quantity <= 0 || product.quantity === undefined) && (
            <Badge bg="danger" className="position-absolute top-0 end-0 m-2">
              Hết hàng
            </Badge>
          )}

          {/* Nếu đã xóa mềm (deletedAt), chồng overlay khóa sản phẩm */}
          {product.deletedAt && (
            <div className="product-overlay position-absolute top-0 left-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
              <span className="discontinued text-white fw-bold">
                Ngừng kinh doanh
              </span>
            </div>
          )}

          {/* Nếu sản phẩm đánh dấu isFeatured = true, hiển thị badge "Nổi bật" */}
          {product.isFeatured && (
            <Badge
              bg="warning"
              text="dark"
              className="position-absolute top-0 start-0 m-2"
            >
              Nổi bật
            </Badge>
          )}
        </div>

        <Card.Body>
          {/* Tiêu đề sản phẩm (cắt ngắn nếu quá dài) */}
          <Card.Title className="product-title text-truncate fs-6 fw-bold">
            {product.name || "Sản phẩm không tên"}
          </Card.Title>
          <Card.Text className="product-code text-muted small mb-1">
            Mã SP: {product.code || "N/A"}
          </Card.Text>
          <Card.Text className="product-price fw-bold text-primary fs-5 mb-1">
            {formatCurrency(product.price)}
          </Card.Text>

          {/* Nếu category tồn tại, hiển thị thông tin danh mục */}
          {product.category && (
            <Card.Text className="product-category small mb-0">
              <span className="text-muted">Danh mục: </span>
              <Badge bg="light" text="dark" className="px-2 py-1">
                {product.category.name || "Không phân loại"}
              </Badge>
            </Card.Text>
          )}
        </Card.Body>
      </Link>

      <Card.Footer className="d-flex justify-content-between bg-white border-top-0 pt-0">
        {/* Nút “Chi tiết” */}
        <Button
          variant="outline-secondary"
          size="sm"
          as={Link}
          to={productId ? `/store/product/${productId}` : "#"}
          className="flex-grow-1 me-2"
          onClick={(e) => {
            if (!productId) {
              // Nếu productId không hợp lệ, ngăn điều hướng và hiển thị cảnh báo
              e.preventDefault();
              toast.warning("Không thể xem chi tiết sản phẩm này");
            }
          }}
        >
          <FaEye className="me-1" /> Chi tiết
        </Button>

        {/* Nút “Thêm vào giỏ” */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddToCart}
          disabled={loading || !productId || !isProductAvailable}
          // Disable nếu đang loading, hoặc productId không hợp lệ, hoặc sản phẩm không có sẵn
          className="flex-grow-1"
          title={
            !isProductAvailable
              ? "Sản phẩm hiện không có sẵn"
              : "Thêm vào giỏ hàng"
          }
        >
          {loading ? (
            // Nếu loading = true, hiển thị spinner nhỏ
            <span
              className="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            // Nếu không loading, hiển thị icon giỏ hàng
            <FaShoppingCart className="me-1" />
          )}
          Thêm vào giỏ
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default ProductCard;
