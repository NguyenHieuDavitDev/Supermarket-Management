import React, { useState, useEffect } from "react";
// Import React và hai hook:
// - useState: để khai báo và cập nhật state cục bộ (product, loading, error, v.v.)
// - useEffect: để thực hiện side effect như gọi API khi component mount hoặc khi dependencies thay đổi

import { useParams, useNavigate } from "react-router-dom";
// Import hai hook từ React Router:
// - useParams: để lấy param (id sản phẩm) từ URL
// - useNavigate: để điều hướng (programmatically) sang route khác

import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Card,
  Badge,
  Form,
  Image,
} from "react-bootstrap";
// Import các component UI từ React Bootstrap:
// - Container: khung chứa chính với padding mặc định
// - Row, Col: bố cục lưới (grid) chia cột
// - Button: nút bấm
// - Spinner: biểu tượng loading
// - Alert: khung hiển thị thông báo (lỗi, cảnh báo, v.v.)
// - Card: khung chứa nội dung chính (hình ảnh, thông tin sản phẩm)
// - Badge: nhãn hiển thị trạng thái như "Hết hàng", "Nổi bật"
// - Form: nhóm trường input (ở đây dùng cho input số lượng)
// - Image: component hiển thị hình ảnh (với lazy loading)

import {
  FaArrowLeft,
  FaShoppingCart,
  FaImage,
  FaStar,
  FaSync,
  FaExclamationTriangle,
} from "react-icons/fa";
// Import các icon từ react-icons/fa:
// - FaArrowLeft: icon mũi tên quay lại
// - FaShoppingCart: icon giỏ hàng
// - FaImage: icon hình ảnh (dùng làm placeholder khi load hình lỗi)
// - FaStar: icon ngôi sao (dùng hiển thị đánh giá sao)
// - FaSync: icon đồng hồ băng (dùng cho nút "Thử lại" khi lỗi)
// - FaExclamationTriangle: icon tam giác cảnh báo (dùng hiển thị lỗi)

import { getProductById, getProduct } from "../../services/api";
// Import hai hàm gọi API từ file services/api:
// - getProductById: gọi API public để lấy chi tiết sản phẩm theo id
// - getProduct: gọi API Dashboard (nếu public API không trả về dữ liệu) để fallback

const ProductDetail = ({ addToCart, isAuthenticated }) => {
  // Định nghĩa component ProductDetail, nhận props:
  // - addToCart: hàm được truyền từ component cha để thêm sản phẩm vào giỏ
  // - isAuthenticated: boolean, true nếu người dùng đã đăng nhập

  const { id } = useParams();
  // Dùng useParams để lấy param "id" từ URL, ví dụ /store/product/123 => id = "123"

  const navigate = useNavigate();
  // Khởi tạo hook useNavigate để điều hướng programmatically sau này

  // Khai báo state cục bộ:
  const [product, setProduct] = useState(null);
  // product: object chứa dữ liệu sản phẩm sau khi fetch

  const [loading, setLoading] = useState(true);
  // loading: boolean để hiển thị Spinner khi đang chờ API

  const [error, setError] = useState(null);
  // error: string hoặc null, chứa thông báo lỗi khi không lấy được sản phẩm

  const [quantity, setQuantity] = useState(1);
  // quantity: số lượng người dùng nhập để thêm vào giỏ (mặc định 1)

  const [imageIndex, setImageIndex] = useState(0);
  // imageIndex: chỉ số ảnh đang hiển thị chính (ở vị trí "carousel" nhỏ)

  const [imageError, setImageError] = useState(false);
  // imageError: boolean để chuyển sang placeholder khi load ảnh chính bị lỗi

  const [retryCount, setRetryCount] = useState(0);
  // retryCount: bộ đếm để re-run useEffect khi người dùng nhấn "Thử lại"

  useEffect(() => {
    // useEffect này chạy khi component mount hoặc khi id/retryCount thay đổi

    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Bật loading spinner

        setError(null);
        // Reset error nếu trước đó có lỗi

        setImageError(false);
        // Reset trạng thái lỗi ảnh

        if (!id) {
          // Nếu không có id (không hợp lệ)
          setError("ID sản phẩm không hợp lệ");
          return;
        }

        // Thử gọi API public first
        let data = await getProductById(id);
        // Nếu public API trả về data (thường response.data), giả sử hàm getProductById đã unwrap

        if (!data) {
          // Nếu public API không trả dữ liệu (ví dụ trả về null hoặc undefined)
          try {
            const response = await getProduct(id);
            data = response?.data;
            // Fallback sang Dashboard API nếu public API không có
          } catch (dashboardError) {
            console.error("Dashboard API fallback failed:", dashboardError);
            // In lỗi fallback API để debug
          }
        }

        if (!data) {
          // Nếu vẫn không có data sau cả hai API
          setError("Không tìm thấy sản phẩm");
          return;
        }

        // Chuẩn hóa dữ liệu sản phẩm để dễ dùng trong component:
        const normalizedProduct = {
          ...data,
          id: data.id || data._id,
          // Đảm bảo luôn có trường id

          images: data.images || [],
          // Đảm bảo luôn có mảng images (có thể rỗng)

          name: data.name || "Sản phẩm không tên",
          // Nếu không có name, đặt default

          code: data.code || "N/A",
          // Nếu không có mã, đặt "N/A"

          price: data.price || 0,
          // Nếu không có price, đặt 0

          description:
            data.description || "Không có mô tả chi tiết cho sản phẩm này",
          // Nếu không có description, đặt default

          category: data.category
            ? {
                ...data.category,
                name: data.category.name || "Không phân loại",
              }
            : null,
          // Nếu có category, đảm bảo category.name luôn có; nếu không có category, gán null
        };

        setProduct(normalizedProduct);
        // Cập nhật state product với dữ liệu đã chuẩn hóa
      } catch (err) {
        console.error("Error fetching product:", err);
        // In lỗi fetch API để debug

        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
        // Cập nhật error message để hiển thị
      } finally {
        setLoading(false);
        // Tắt loading spinner dù thành công hay lỗi
      }
    };

    fetchProduct();
    // Gọi hàm fetchProduct mỗi khi id hoặc retryCount thay đổi
  }, [id, retryCount]);

  // Hàm handleRetry: tăng retryCount để trigger useEffect và fetch lại
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Hàm handleAddToCart: thêm sản phẩm vào giỏ khi người dùng nhấn nút
  const handleAddToCart = () => {
    if (!product) return;
    // Nếu product không tồn tại, không làm gì

    try {
      const success = addToCart(product, quantity);
      // Gọi hàm addToCart từ props, truyền vào product và số lượng
      if (success) {
        // Nếu addToCart trả về true (thành công)
        navigate("/store/cart");
        // Điều hướng đến trang giỏ hàng
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      // In lỗi khi thêm vào giỏ
    }
  };

  // Hàm handleQuantityChange: xử lý khi người dùng thay đổi input số lượng
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    // Chuyển chuỗi sang số nguyên

    if (!isNaN(value) && value > 0) {
      // Nếu value là số và > 0
      const maxAvailable = product?.quantity || 1;
      // Lấy số lượng tồn kho nếu có, hoặc mặc định 1

      setQuantity(Math.min(value, maxAvailable));
      // Gán quantity = min(value, maxAvailable) để không vượt quá tồn kho
    }
  };

  // Hàm handleImageError: đánh dấu imageError = true khi load ảnh lỗi
  const handleImageError = () => {
    setImageError(true);
  };

  // Hàm getProductImage: trả về URL ảnh chính hoặc placeholder khi lỗi/không có ảnh
  const getProductImage = () => {
    if (imageError) {
      // Nếu đã có lỗi load ảnh chính
      return `https://via.placeholder.com/500x500?text=${encodeURIComponent(
        product?.name || "No Image"
      )}`;
    }

    if (!product || !product.images || product.images.length === 0) {
      // Nếu không có product hoặc mảng ảnh rỗng
      return `https://via.placeholder.com/500x500?text=${encodeURIComponent(
        product?.name || "No Image"
      )}`;
    }

    // Lấy URL ảnh tại index hiện tại (imageIndex)
    const imgUrl = product.images[imageIndex]?.url;

    // Kiểm tra URL hợp lệ (bắt đầu bằng http:// hoặc https://)
    if (
      !imgUrl ||
      (!imgUrl.startsWith("http://") && !imgUrl.startsWith("https://"))
    ) {
      return `https://via.placeholder.com/500x500?text=${encodeURIComponent(
        product?.name || "No Image"
      )}`;
    }

    return imgUrl;
  };

  // Hàm handleThumbnailError: nếu thumbnail lỗi, gán src thành placeholder riêng
  const handleThumbnailError = (e, idx) => {
    // idx là chỉ số thumbnail, hiển thị text “Image X”
    e.target.src = `https://via.placeholder.com/100x100?text=Image+${idx + 1}`;
  };

  // Hàm formatCurrency: định dạng số thành chuỗi VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // === Render logic ===
  if (loading) {
    // Nếu loading = true, hiển thị Spinner
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">Đang tải thông tin sản phẩm...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    // Nếu có error (error có giá trị), hiển thị Alert và nút “Thử lại”
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>
            <FaExclamationTriangle className="me-2" />
            Lỗi
          </Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-between">
            <Button variant="outline-danger" onClick={handleRetry}>
              <FaSync className="me-2" /> Thử lại
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => navigate("/store/products")}
            >
              Quay lại danh sách sản phẩm
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    // Nếu đã hết loading nhưng product vẫn null, nghĩa là không tìm thấy sản phẩm
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Không tìm thấy sản phẩm</Alert.Heading>
          <p>Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-warning"
              onClick={() => navigate("/store/products")}
            >
              Xem sản phẩm khác
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Nếu chạy đến đây, nghĩa là đã có product và không có lỗi
  return (
    <Container className="py-4">
      {/* Nút “Quay lại” */}
      <Button
        variant="outline-secondary"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Quay lại
      </Button>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row>
            {/* Cột chứa hình ảnh sản phẩm */}
            <Col lg={6} md={12} className="mb-4">
              <div className="product-image-container">
                {product.images && product.images.length > 0 ? (
                  <>
                    {/* Ảnh chính */}
                    <div
                      className="main-image-container mb-3 bg-light rounded d-flex align-items-center justify-content-center"
                      style={{ minHeight: "400px" }}
                    >
                      {imageError ? (
                        // Nếu load hình chính lỗi
                        <div className="text-center p-5">
                          <FaImage size={50} className="text-secondary mb-2" />
                          <p>Không thể tải hình ảnh</p>
                        </div>
                      ) : (
                        // Nếu không lỗi, hiển thị ảnh chính
                        <Image
                          src={getProductImage()}
                          alt={product.name || "Sản phẩm"}
                          className="img-fluid rounded main-product-image"
                          onError={handleImageError}
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />
                      )}
                    </div>

                    {/* Dòng thumbnail nếu có nhiều hơn 1 ảnh */}
                    {product.images.length > 1 && (
                      <Row className="image-thumbnails">
                        {product.images.map((image, idx) => {
                          // Xác định URL thumbnail hợp lệ hoặc placeholder
                          const isValid =
                            image.url &&
                            (image.url.startsWith("http://") ||
                              image.url.startsWith("https://"));
                          const thumbSrc = isValid
                            ? image.url
                            : `https://via.placeholder.com/100x100?text=Image+${
                                idx + 1
                              }`;

                          return (
                            <Col key={`thumb-${idx}`} xs={3} className="mb-2">
                              <Image
                                src={thumbSrc}
                                alt={`${product.name} - Ảnh ${idx + 1}`}
                                className={`img-thumbnail cursor-pointer ${
                                  imageIndex === idx ? "border-primary" : ""
                                }`}
                                onClick={() => {
                                  setImageError(false);
                                  setImageIndex(idx);
                                }}
                                onError={(e) => handleThumbnailError(e, idx)}
                                style={{
                                  height: "80px",
                                  width: "100%",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                              />
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </>
                ) : (
                  // Nếu không có ảnh nào, hiển thị placeholder
                  <div className="text-center p-5 bg-light rounded">
                    <FaImage size={50} className="text-secondary mb-2" />
                    <p>Không có hình ảnh</p>
                  </div>
                )}
              </div>
            </Col>

            {/* Cột chứa thông tin chi tiết sản phẩm */}
            <Col lg={6} md={12}>
              <h2>{product.name || "Sản phẩm không có tên"}</h2>

              {/* Mã sản phẩm, trạng thái tồn kho, và danh mục */}
              <div className="mb-3">
                <Badge bg="secondary" className="me-2">
                  Mã: {product.code || "N/A"}
                </Badge>
                <Badge bg={product.quantity > 0 ? "success" : "danger"}>
                  {product.quantity > 0 ? "Còn hàng" : "Hết hàng"}
                </Badge>

                {product.category && (
                  <Badge bg="info" className="ms-2">
                    {product.category.name || "Không phân loại"}
                  </Badge>
                )}
              </div>

              {/* Hiển thị đánh giá sao (rating) nếu có */}
              <div className="d-flex align-items-center mb-3">
                <div className="ratings">
                  {[...Array(5)].map((_, idx) => (
                    <FaStar
                      key={`star-${idx}`}
                      className={
                        idx < (product.rating || 0)
                          ? "text-warning"
                          : "text-secondary"
                      }
                    />
                  ))}
                </div>
                <span className="ms-2 text-muted">
                  {product.rating ? `${product.rating}/5` : "Chưa có đánh giá"}
                </span>
              </div>

              {/* Giá sản phẩm */}
              <h3 className="text-primary price-display mb-3">
                {formatCurrency(product.price || 0)}
              </h3>

              {/* Mô tả sản phẩm */}
              <div className="product-description mb-4">
                <h5>Mô tả sản phẩm:</h5>
                <p>
                  {product.description ||
                    "Không có mô tả chi tiết cho sản phẩm này."}
                </p>
              </div>

              {/* Phần “Thêm vào giỏ” */}
              <div className="add-to-cart-section">
                {product.quantity > 0 && !product.deletedAt ? (
                  <>
                    {/* Input chọn số lượng */}
                    <div className="d-flex align-items-center mb-3">
                      <Form.Label className="me-3 mb-0">Số lượng:</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                        style={{ width: "80px" }}
                      />
                      <span className="ms-3 text-muted">
                        Còn {product.quantity} sản phẩm
                      </span>
                    </div>

                    {/* Nút “Thêm vào giỏ hàng” */}
                    <Button
                      variant="primary"
                      size="lg"
                      className="d-flex align-items-center"
                      onClick={handleAddToCart}
                      disabled={!isAuthenticated}
                      // Nếu chưa đăng nhập, disable nút
                    >
                      <FaShoppingCart className="me-2" />
                      Thêm vào giỏ hàng
                    </Button>

                    {!isAuthenticated && (
                      // Nếu chưa đăng nhập, hiển thị cảnh báo đăng nhập
                      <Alert variant="warning" className="mt-3">
                        Vui lòng{" "}
                        <Alert.Link onClick={() => navigate("/login")}>
                          đăng nhập
                        </Alert.Link>{" "}
                        để mua hàng
                      </Alert>
                    )}
                  </>
                ) : (
                  // Nếu sản phẩm hết hàng hoặc đã bị xóa, hiển thị Alert
                  <Alert variant="danger">
                    {product.deletedAt
                      ? "Sản phẩm này đã ngừng kinh doanh"
                      : "Sản phẩm hiện đã hết hàng"}
                  </Alert>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Phần hiển thị "Thông số kỹ thuật" nếu có */}
      {product.specifications &&
        Object.keys(product.specifications).length > 0 && (
          <Card className="mt-4 border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h4 className="mb-0">Thông số kỹ thuật</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                {Object.entries(product.specifications).map(
                  ([key, value], idx) => (
                    <Col key={`spec-${idx}`} md={6} className="mb-2">
                      <div className="d-flex">
                        <strong className="me-2">{key}:</strong>
                        <span>{value || "N/A"}</span>
                      </div>
                    </Col>
                  )
                )}
              </Row>
            </Card.Body>
          </Card>
        )}
    </Container>
  );
};

export default ProductDetail;
