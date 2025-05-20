import React, { useState, useEffect } from "react";
// Nhập React và hai hook useState, useEffect để quản lý trạng thái và xử lý side effect

import {
  Row, // Tạo hàng trong lưới Bootstrap
  Col, // Tạo cột trong lưới Bootstrap
  Form, // Dùng cho các nhóm input trong biểu mẫu
  Button, // Nút bấm
  Pagination, // Thành phần phân trang
  Alert, // Hiển thị thông báo (thông tin, lỗi, v.v.)
  Spinner, // Hiển thị spinner khi đang tải
  Card, // Thẻ chứa nội dung với bóng đổ
  Image, // Hiển thị hình ảnh (chưa được dùng trong code này, nhưng đã import sẵn)
} from "react-bootstrap";
// React-Bootstrap cung cấp sẵn các component giao diện tuân theo Bootstrap

import { getPublicProducts, getProducts } from "../../services/api";
// Nhập hai hàm API để gọi backend lấy danh sách sản phẩm
// getPublicProducts dành cho người chưa đăng nhập, getProducts có thể dành cho người đã xác thực

import ProductCard from "./ProductCard";
// Nhập component con để hiển thị thông tin chi tiết từng sản phẩm

import { FaFilter, FaSort, FaTimes, FaBoxOpen, FaSync } from "react-icons/fa";
// Nhập các icon Font Awesome để dùng trong UI (lọc, sắp xếp, xóa, hộp trống, đồng bộ lại)

const ProductList = ({
  categoryId, // ID danh mục sản phẩm để lọc
  searchQuery, // Chuỗi tìm kiếm sản phẩm
  isAuthenticated, // Trạng thái đã đăng nhập hay chưa
  addToCart, // Hàm xử lý thêm sản phẩm vào giỏ hàng
  products: providedProducts, // Danh sách sản phẩm truyền sẵn (nếu có)
  loading: providedLoading, // Trạng thái loading truyền sẵn (nếu có)
  error: providedError, // Thông báo lỗi truyền sẵn (nếu có)
  limit = 8, // Số sản phẩm mỗi trang, mặc định 8
  showFilters = true, // Có hiển thị bộ lọc hay không, mặc định true
}) => {
  // Component nhận các props để cấu hình: lọc theo danh mục, tìm kiếm, phân trang, ...
  // providedProducts/providedLoading/providedError giúp tái sử dụng component khi dữ liệu đã có sẵn

  const [products, setProducts] = useState(providedProducts || []);
  // products: mảng sản phẩm hiện tại hiển thị. Nếu có providedProducts thì lấy giá trị đó, ngược lại khởi tạo mảng rỗng

  const [loading, setLoading] = useState(providedLoading || true);
  // loading: trạng thái đang tải dữ liệu. Nếu có providedLoading thì dùng, ngược lại mặc định true để hiển thị spinner

  const [error, setError] = useState(providedError || "");
  // error: chứa thông báo lỗi (nếu có). Nếu có providedError thì dùng, ngược lại là chuỗi rỗng

  const [currentPage, setCurrentPage] = useState(1);
  // currentPage: trang hiện tại, bắt đầu từ 1

  const [totalPages, setTotalPages] = useState(0);
  // totalPages: tổng số trang nhận về từ API. Mặc định 0 cho đến khi API trả về

  const [totalItems, setTotalItems] = useState(0);
  // totalItems: tổng số sản phẩm (để hiển thị "Hiển thị X / Y sản phẩm")

  const [sortBy, setSortBy] = useState("createdAt");
  // sortBy: trường để sắp xếp (mặc định theo ngày tạo)

  const [sortOrder, setSortOrder] = useState("DESC");
  // sortOrder: chiều sắp xếp (ASC hoặc DESC), mặc định DESC

  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  // priceRange: filter khoảng giá, với min và max là chuỗi (nếu chưa nhập thì rỗng)

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  // filtersExpanded: trạng thái ẩn/hiện bộ lọc trên thiết bị di động

  const [retryCount, setRetryCount] = useState(0);
  // retryCount: đếm số lần thử lại, để kích hoạt useEffect khi có lỗi và người dùng nhấn "Thử lại"

  useEffect(() => {
    // useEffect chạy khi component mount và khi các giá trị trong dependency array thay đổi

    // Nếu có providedProducts (ứng dụng cấp dữ liệu từ ngoài), thì không gọi API, chỉ gán và return
    if (providedProducts) {
      setProducts(providedProducts);
      setLoading(providedLoading || false);
      setError(providedError || "");
      return; // Dừng xử lý tiếp, không gọi API
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Bật loading spinner

        setError("");
        // Xóa lỗi cũ trước khi gọi API

        const params = {
          page: currentPage, // Trang hiện tại
          limit, // Số sản phẩm mỗi trang
          sortField: sortBy, // Trường để sắp xếp
          sortOrder, // Chiều sắp xếp
          search: searchQuery || "", // Chuỗi tìm kiếm (nếu không có, để rỗng)
        };

        // Nếu có categoryId, thêm vào params để lọc theo danh mục
        if (categoryId) {
          params.categoryId = categoryId;
        }

        // Nếu người dùng đã nhập giá min, thêm minPrice vào params
        if (priceRange.min) params.minPrice = priceRange.min;
        // Nếu người dùng đã nhập giá max, thêm maxPrice vào params
        if (priceRange.max) params.maxPrice = priceRange.max;

        // Gọi API getPublicProducts với các tham số
        const data = await getPublicProducts(params);

        // Chuẩn bị biến chứa danh sách sản phẩm raw trả về
        let productList = [];

        // Nếu data có trường data.products và đó là mảng, gán vào productList
        if (data?.products && Array.isArray(data.products)) {
          productList = data.products;
        }
        // Ngược lại, nếu data trực tiếp là mảng, cũng gán vào productList
        else if (Array.isArray(data)) {
          productList = data;
        }

        // Chuẩn hóa mỗi item trong mảng productList
        const productsWithImages = productList.map((product) => ({
          ...product, // Giữ nguyên các trường khác
          id: product.id || product._id, // Đảm bảo có id (trường id hoặc _id)
          images: product.images || [], // Đảm bảo trường images luôn là mảng
          name: product.name || "Sản phẩm không tên", // Nếu không có name, đặt mặc định
          price: product.price || 0, // Nếu không có price, mặc định 0
          code: product.code || "N/A", // Nếu không có code, đặt N/A
          description: product.description || "Không có mô tả", // Mô tả mặc định
        }));

        // Cập nhật state products với danh sách đã chuẩn hóa
        setProducts(productsWithImages);

        // Cập nhật totalPages từ data trả về, nếu không có thì để 1
        setTotalPages(data?.totalPages || 1);

        // Cập nhật totalItems từ API, nếu không có thì lấy độ dài mảng productsWithImages hoặc 0
        setTotalItems(data?.totalItems || productsWithImages.length || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
        // Nếu getPublicProducts lỗi, gán thông báo lỗi chung
        setError("Không thể tải danh sách sản phẩm");

        // Thử fallback sang API getProducts
        try {
          const params = {
            page: currentPage,
            limit,
            sortField: sortBy,
            sortOrder,
            search: searchQuery || "",
            ...(categoryId && { categoryId }),
            ...(priceRange.min && { minPrice: priceRange.min }),
            ...(priceRange.max && { maxPrice: priceRange.max }),
          };

          // Gọi fallback API getProducts
          const response = await getProducts(params);
          const productList = response?.data?.products || [];

          // Chuẩn hóa dữ liệu từ fallback API
          const productsWithImages = productList.map((product) => ({
            ...product,
            id: product.id || product._id,
            images: product.images || [],
            name: product.name || "Sản phẩm không tên",
            price: product.price || 0,
            code: product.code || "N/A",
            description: product.description || "Không có mô tả",
          }));

          setProducts(productsWithImages);
          setTotalPages(response?.data?.totalPages || 1);
          setTotalItems(
            response?.data?.totalItems || productsWithImages.length || 0
          );
          setError(""); // Xóa lỗi nếu fallback thành công
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
          // Nếu fallback cũng lỗi, đặt products thành mảng rỗng
          setProducts([]);
        }
      } finally {
        setLoading(false);
        // Tắt loading spinner ở cuối, dù thành công hay thất bại
      }
    };

    // Gọi hàm fetchProducts
    fetchProducts();
  }, [
    categoryId, // Khi thay đổi categoryId, gọi lại
    searchQuery, // Khi thay đổi searchQuery, gọi lại
    currentPage, // Khi thay đổi trang, gọi lại
    limit, // Khi thay đổi limit, gọi lại
    sortBy, // Khi thay đổi trường sắp xếp, gọi lại
    sortOrder, // Khi thay đổi thứ tự sắp xếp, gọi lại
    priceRange, // Khi thay đổi bộ lọc giá, gọi lại
    providedProducts, // Khi props providedProducts thay đổi, gọi lại
    providedLoading, // Khi props providedLoading thay đổi, gọi lại
    providedError, // Khi props providedError thay đổi, gọi lại
    retryCount, // Khi người dùng nhấn retry, tăng retryCount => gọi lại
  ]);

  // Hàm xử lý khi nhấn nút "Thử lại" (nếu API lỗi)
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Tăng retryCount để useEffect chạy lại và gọi API lần nữa
  };

  // Hàm xử lý sự kiện khi người dùng chọn tùy chọn sắp xếp từ dropdown
  const handleSortChange = (e) => {
    const value = e.target.value;

    if (value === "price_asc") {
      setSortBy("price");
      setSortOrder("ASC");
    } else if (value === "price_desc") {
      setSortBy("price");
      setSortOrder("DESC");
    } else if (value === "name_asc") {
      setSortBy("name");
      setSortOrder("ASC");
    } else if (value === "name_desc") {
      setSortBy("name");
      setSortOrder("DESC");
    } else {
      setSortBy("createdAt");
      setSortOrder("DESC");
    }

    setCurrentPage(1);
    // Quay về trang 1 sau khi thay đổi sắp xếp
  };

  // Hàm xử lý khi người dùng nhập giá trị min hoặc max
  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({
      ...prev,
      [name]: value, // name là "min" hoặc "max"
    }));
  };

  // Hàm áp dụng bộ lọc giá (chỉ reset trang về 1, useEffect sẽ gọi API)
  const applyPriceFilter = () => {
    setCurrentPage(1);
  };

  // Hàm xóa bộ lọc giá (đặt lại giá min, max về rỗng và reset trang)
  const clearPriceFilter = () => {
    setPriceRange({ min: "", max: "" });
    setCurrentPage(1);
  };

  // Hàm bật/tắt hiển thị bộ lọc trên mobile
  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  // Hàm xử lý chuyển trang khi người dùng nhấn nút phân trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Cuộn mượt lên đầu trang khi chuyển trang để UX tốt hơn
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hàm tạo các item phân trang (Previous, số trang, Next)
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    // Nếu chỉ có 1 trang hoặc không có trang nào, không hiển thị pagination

    const items = [];
    const maxItems = 5; // Số nút hiển thị tối đa

    // Nút Previous
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        // Disabled nếu đang ở trang đầu
      />
    );

    // Tính dải trang cần hiển thị (giữ currentPage ở giữa nếu có thể)
    let startPage = Math.max(1, currentPage - Math.floor(maxItems / 2));
    let endPage = Math.min(totalPages, startPage + maxItems - 1);

    // Nếu dải trang hiển thị chưa đủ maxItems (gần cuối), điều chỉnh lại
    if (endPage - startPage + 1 < maxItems) {
      startPage = Math.max(1, endPage - maxItems + 1);
    }

    // Nếu startPage > 1, thêm nút trang đầu và ellipsis
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Tạo nút cho từng trang trong khoảng startPage -> endPage
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Nếu endPage < totalPages, thêm ellipsis và nút trang cuối
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
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
        // Disabled nếu đang ở trang cuối
      />
    );

    // Trả về component Pagination với các item đã tạo
    return (
      <Pagination className="justify-content-center mt-4">{items}</Pagination>
    );
  };

  // Nếu đang loading và chưa có sản phẩm nào, hiển thị spinner trung tâm
  if (loading && products.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải sản phẩm...</p>
      </div>
    );
  }

  // Nếu có lỗi và products rỗng, hiển thị thông báo lỗi với nút Thử lại
  if (error && products.length === 0) {
    return (
      <Alert variant="danger" className="my-4 text-center py-4">
        <FaBoxOpen size={40} className="text-danger mb-3" />
        <Alert.Heading>Không thể tải sản phẩm</Alert.Heading>
        <p className="mb-3">{error}</p>
        <Button variant="outline-danger" onClick={handleRetry}>
          <FaSync className="me-2" /> Thử lại
        </Button>
      </Alert>
    );
  }

  return (
    <div className="product-list-container">
      {/* Nếu showFilters = true thì hiển thị khung lọc */}
      {showFilters && (
        <Card className="filters mb-4 shadow-sm">
          <Card.Body>
            {/* Nút bật/tắt bộ lọc trên mobile */}
            <div className="d-md-none mb-3">
              <Button
                variant="outline-primary"
                onClick={toggleFilters}
                className="w-100"
              >
                <FaFilter className="me-2" />
                {filtersExpanded ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </Button>
            </div>

            {/* Khung chứa nội dung bộ lọc: trên desktop luôn hiển thị, trên mobile tùy biến theo filtersExpanded */}
            <div
              className={`filter-container ${
                filtersExpanded ? "d-block" : "d-none d-md-block"
              }`}
            >
              <Row>
                {/* Cột 1: chọn sắp xếp */}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <FaSort className="me-2" />
                      Sắp xếp theo
                    </Form.Label>
                    <Form.Select
                      value={`${sortBy}_${sortOrder}`}
                      onChange={handleSortChange}
                    >
                      <option value="createdAt_DESC">Mới nhất</option>
                      <option value="price_ASC">Giá thấp đến cao</option>
                      <option value="price_DESC">Giá cao đến thấp</option>
                      <option value="name_ASC">Tên A-Z</option>
                      <option value="name_DESC">Tên Z-A</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Cột 2: bộ lọc khoảng giá */}
                <Col md={6}>
                  <Form.Label className="fw-bold">
                    <FaFilter className="me-2" />
                    Khoảng giá
                  </Form.Label>
                  <Row className="gx-2">
                    {/* Input giá từ */}
                    <Col xs={5}>
                      <Form.Control
                        type="number"
                        placeholder="Từ"
                        name="min"
                        value={priceRange.min}
                        onChange={handlePriceRangeChange}
                      />
                    </Col>
                    {/* Input giá đến */}
                    <Col xs={5}>
                      <Form.Control
                        type="number"
                        placeholder="Đến"
                        name="max"
                        value={priceRange.max}
                        onChange={handlePriceRangeChange}
                      />
                    </Col>
                    {/* Nút áp dụng bộ lọc giá */}
                    <Col xs={2}>
                      <Button
                        variant="primary"
                        onClick={applyPriceFilter}
                        className="w-100"
                        title="Áp dụng"
                      >
                        <i className="fas fa-check"></i>
                      </Button>
                    </Col>
                  </Row>

                  {/* Nếu đã nhập min hoặc max, hiển thị nút xóa bộ lọc giá */}
                  {(priceRange.min || priceRange.max) && (
                    <div className="mt-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={clearPriceFilter}
                      >
                        <FaTimes className="me-1" />
                        Xóa bộ lọc giá
                      </Button>
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Nếu có tổng số sản phẩm > 0, hiển thị dòng "Hiển thị X / Y sản phẩm" */}
      {totalItems > 0 && (
        <p className="text-muted mb-3">
          Hiển thị {products.length} / {totalItems} sản phẩm
        </p>
      )}

      {/* Nếu không có sản phẩm nào, hiển thị thông báo tương ứng */}
      {products.length === 0 ? (
        <Alert variant="info" className="text-center p-5 shadow-sm">
          <FaBoxOpen size={50} className="mb-3 text-primary" />
          <Alert.Heading>Không tìm thấy sản phẩm nào</Alert.Heading>
          <p>
            {searchQuery || categoryId || priceRange.min || priceRange.max
              ? "Không tìm thấy sản phẩm phù hợp với điều kiện tìm kiếm của bạn."
              : "Hiện chưa có sản phẩm nào trong hệ thống."}
          </p>
          {(searchQuery || categoryId || priceRange.min || priceRange.max) && (
            <Button
              variant="outline-primary"
              onClick={clearPriceFilter}
              className="mt-2"
            >
              Xóa bộ lọc và xem tất cả sản phẩm
            </Button>
          )}
        </Alert>
      ) : (
        <>
          {/* Hiển thị lưới sản phẩm (2 cột trên mobile, 3 cột tablet, 4 cột desktop) */}
          <Row xs={2} md={3} lg={4} className="g-3">
            {products.map((product, index) => (
              <Col key={product.id || product._id || `product-${index}`}>
                <ProductCard
                  product={product}
                  addToCart={addToCart}
                  isAuthenticated={isAuthenticated}
                />
              </Col>
            ))}
          </Row>

          {/* Hiển thị pagination nếu có nhiều hơn 1 trang */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default ProductList;
