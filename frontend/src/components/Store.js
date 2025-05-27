// Import React và các hook cần thiết từ thư viện React
import React, { useEffect, useState } from "react";
// Import các thành phần định tuyến (routing) từ react-router-dom
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// Import một số component từ React‑Bootstrap để xây dựng giao diện
import { Container, Breadcrumb, Alert } from "react-bootstrap";
// Import ToastContainer và toast từ react-toastify để hiển thị thông báo (toast)
import { ToastContainer, toast } from "react-toastify";
// Import CSS của react-toastify để hiển thị toast đúng kiểu
import "react-toastify/dist/ReactToastify.css";
// Import các icon từ react‑icons
import { FaExclamationTriangle, FaSync } from "react-icons/fa";

// Import các component con dùng trong phần store (website bán hàng)
import Header from "./store/Header"; // Phần header (thanh điều hướng trên cùng)
import Footer from "./store/Footer"; // Phần footer (chân trang)
import HomePage from "./store/HomePage"; // Trang chủ
import ProductList from "./store/ProductList"; // Trang hiển thị danh sách sản phẩm
import ProductDetail from "./store/ProductDetail"; // Trang chi tiết sản phẩm
import Cart from "./store/Cart"; // Trang giỏ hàng
import Checkout from "./store/Checkout"; // Trang thanh toán
import OrderSuccess from "./store/OrderSuccess"; // Trang thông báo đặt hàng thành công
import Orders from "./store/Orders"; // Trang danh sách đơn hàng của khách
import Login from "./store/Login"; // Trang đăng nhập

// Import các hàm API cần thiết
import { checkAuth, getProducts } from "../services/api";

// Component chính quản lý toàn bộ phần store
const Store = () => {
  // State kiểm soát xem người dùng đã được xác thực (đăng nhập) hay chưa
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // State lưu thông tin user (id, tên, email, v.v.) nếu đã đăng nhập
  const [user, setUser] = useState(null);
  // State báo ứng dụng đang ở trạng thái loading (kiểm tra token, load dữ liệu ban đầu,...)
  const [loading, setLoading] = useState(true);
  // State lưu thông báo lỗi xác thực (nếu checkAuth thất bại)
  const [authError, setAuthError] = useState("");
  // State lưu nội dung giỏ hàng hiện tại (mảng các item)
  const [cart, setCart] = useState([]);
  // State đếm số lần retry khi check authentication (dùng để trigger useEffect)
  const [retryCount, setRetryCount] = useState(0);

  // Hook useNavigate để chuyển hướng (redirect) trang
  const navigate = useNavigate();
  // Hook useLocation để lấy đường dẫn hiện tại (chức năng tạo breadcrumbs)
  const location = useLocation();

  //
  // 1. EFFECT: Kiểm tra trạng thái xác thực ngay khi load hoặc khi retryCount thay đổi
  //
  useEffect(() => {
    // Hàm async để check token và tải thông tin user, cart từ localStorage
    const checkAuthentication = async () => {
      try {
        setLoading(true); // Bắt đầu loading
        setAuthError(""); // Xóa lỗi xác thực cũ (nếu có)

        // Lấy token từ localStorage (nếu user đã login trước đó)
        const token = localStorage.getItem("token");
        if (token) {
          try {
            // Gọi API checkAuth, nếu thành công nghĩa là token hợp lệ
            const response = await checkAuth();
            setIsAuthenticated(true); // Đánh dấu đã xác thực

            // Lấy dữ liệu user từ localStorage (đã lưu khi đăng nhập lần trước)
            const userData = localStorage.getItem("user");
            if (userData) {
              try {
                // Parse chuỗi JSON lưu trong localStorage thành object
                setUser(JSON.parse(userData));
              } catch (parseError) {
                // Nếu parse lỗi (dữ liệu bị hỏng), xóa khỏi localStorage
                console.error("Failed to parse user data:", parseError);
                localStorage.removeItem("user");
              }
            }

            // Lấy giỏ hàng từ localStorage (nếu có)
            const savedCart = localStorage.getItem("cart");
            if (savedCart) {
              try {
                // Parse chuỗi JSON thành mảng item
                setCart(JSON.parse(savedCart));
              } catch (parseError) {
                // Nếu parse lỗi, xóa khỏi localStorage
                console.error("Failed to parse cart data:", parseError);
                localStorage.removeItem("cart");
              }
            }
          } catch (error) {
            // Nếu checkAuth thất bại (token hết hạn hoặc không hợp lệ)
            console.error("Auth check error:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsAuthenticated(false);
            setUser(null);
            setAuthError(
              "Không thể xác thực phiên đăng nhập. Vui lòng đăng nhập lại."
            );
          }
        }
      } catch (error) {
        // Nếu có lỗi khác (network, code ...) thì thông báo chung
        console.error("Authentication check failed:", error);
        setAuthError("Lỗi xác thực. Vui lòng thử lại sau.");
      } finally {
        setLoading(false); // Kết thúc loading
      }
    };

    // Gọi hàm checkAuthentication ở trên
    checkAuthentication();
  }, [retryCount]); // Chạy lại khi retryCount thay đổi (khi click nút 'Thử lại')

  // Hàm trigger khi người dùng click 'Thử lại' bên trong cảnh báo lỗi xác thực
  const handleRetryAuth = () => {
    setRetryCount((prev) => prev + 1);
  };

  //
  // 2. EFFECT: Lưu giỏ hàng (cart) vào localStorage mỗi khi cart thay đổi
  //
  useEffect(() => {
    if (cart.length > 0) {
      // Nếu cart có item, lưu vào localStorage
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
        // Hiển thị toast lỗi nếu lưu không thành công
        toast.error("Không thể lưu giỏ hàng vào bộ nhớ. Vui lòng thử lại.");
      }
    } else if (cart.length === 0 && localStorage.getItem("cart")) {
      // Nếu cart trống và trước đó đã có cart trong localStorage thì xóa luôn
      localStorage.removeItem("cart");
    }
  }, [cart]); // Chạy mỗi khi cart thay đổi

  //
  // 3. Hàm addToCart: Thêm sản phẩm vào giỏ hàng (khi user bấm 'Thêm vào giỏ')
  //
  const addToCart = async (product, quantity) => {
    // Nếu user chưa đăng nhập, yêu cầu đăng nhập trước khi mua hàng
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để mua hàng");
      navigate("/store/login");
      return false;
    }

    // Kiểm tra dữ liệu product hợp lệ
    if (!product || !product.id) {
      toast.error("Không thể thêm sản phẩm vào giỏ hàng");
      return false;
    }

    try {
      // Kiểm tra xem item đã có trong cart chưa
      const existingItem = cart.find((item) => item.id === product.id);

      if (existingItem) {
        // Nếu sản phẩm đã tồn tại trong cart, cập nhật số lượng
        const newQuantity = existingItem.quantity + quantity;

        // Nếu số lượng cộng thêm vượt quá số lượng có sẵn (availableQuantity)
        if (newQuantity > (product.quantity || 0)) {
          toast.warning(`Chỉ còn ${product.quantity} sản phẩm trong kho`);
          // Đặt lại số lượng bằng đúng mức tối đa có sẵn
          updateCartItem(product.id, product.quantity);
          return true;
        }

        // Cập nhật quantity mới vào cart
        updateCartItem(product.id, newQuantity);
        toast.success(
          `Đã cập nhật số lượng sản phẩm "${product.name}" trong giỏ hàng`
        );
      } else {
        // Nếu chưa có trong cart, tạo mới một item và thêm vào mảng cart
        const newItem = {
          id: product.id,
          name: product.name || "Sản phẩm không tên",
          code: product.code || "N/A",
          price: product.price || 0,
          quantity: Math.min(quantity, product.quantity || 1),
          image:
            product.images && product.images.length > 0
              ? product.images[0].url
              : null,
          availableQuantity: product.quantity || 0,
        };

        setCart((prevCart) => [...prevCart, newItem]);
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
      }
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Không thể thêm sản phẩm vào giỏ hàng");
      return false;
    }
  };

  //
  // Hàm updateCartItem: Cập nhật số lượng của một item trong cart
  //
  const updateCartItem = (itemId, newQuantity) => {
    if (!itemId) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId) {
          // Đảm bảo quantity không dưới 1 và không vượt quá availableQuantity
          const quantity = Math.max(
            1,
            Math.min(newQuantity, item.availableQuantity || Infinity)
          );
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  //
  // Hàm removeCartItem: Xóa 1 item theo itemId khỏi cart
  //
  const removeCartItem = (itemId) => {
    if (!itemId) return;

    // Tìm item sắp xóa để hiển thị toast thông tin
    const itemToRemove = cart.find((item) => item.id === itemId);
    if (itemToRemove) {
      toast.info(`Đã xóa "${itemToRemove.name}" khỏi giỏ hàng`);
    }

    // Lọc ra mảng mới, bỏ item có id trùng với itemId
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));

    // Nếu cart chỉ còn 1 item (sắp xóa) thì sau khi xóa cart sẽ rỗng -> xóa localStorage
    if (cart.length === 1) {
      localStorage.removeItem("cart");
    }
  };

  //
  // Hàm clearCart: Xóa toàn bộ các item trong cart
  //
  const clearCart = () => {
    if (cart.length > 0) {
      toast.info("Đã xóa tất cả sản phẩm khỏi giỏ hàng");
    }
    setCart([]); // Đặt mảng cart thành rỗng
    localStorage.removeItem("cart"); // Xóa cart khỏi localStorage
  };

  //
  // 4. Hàm handleLogin: Xử lý đăng nhập thành công (được gọi từ component Login)
  //
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setAuthError("");

    try {
      // Lưu thông tin user vào localStorage để duy trì session
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to store user data:", error);
      toast.warning(
        "Không thể lưu thông tin người dùng vào bộ nhớ trình duyệt"
      );
    }

    toast.success("Đăng nhập thành công!");

    // Nếu trước đó có tham số redirect trên URL (ví dụ khi bị chuyển đến login
    // vì chưa xác thực, rồi sau login thì quay về trang gốc), lấy query param và navigate
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");
    if (redirect) {
      navigate(`/store/${redirect}`);
    }
  };

  //
  // 5. Hàm handleLogout: Xử lý khi người dùng log out
  //
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCart([]);

    // Xóa dữ liệu liên quan khỏi localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");

    toast.info("Đã đăng xuất khỏi hệ thống");
    // Sau khi logout, chuyển hướng về trang chủ store
    navigate("/store");
  };

  //
  // 6. Component con StoreBreadcrumb: Tạo breadcrumb tùy theo đường dẫn hiện tại
  //
  const StoreBreadcrumb = () => {
    const path = location.pathname; // Lấy đường dẫn hiện tại, ví dụ "/store/products"

    // Nếu ở trang chủ ("/"), không hiển thị breadcrumb
    if (path === "/") return null;

    // Tách chuỗi path thành mảng các phần (filter bỏ phần rỗng do dấu '/')
    const pathParts = path.split("/").filter((part) => part);
    const breadcrumbItems = [];

    // Thêm link "Trang chủ" luôn nằm đầu
    breadcrumbItems.push(
      <Breadcrumb.Item key="home" href="/">
        Trang chủ
      </Breadcrumb.Item>
    );

    // Xây dựng từng phần của breadcrumb
    let currentPath = "";
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;

      // Nếu là phần cuối cùng (active, không có đường link)
      if (index === pathParts.length - 1) {
        let label = "";

        // Chuyển tên route thành text dễ đọc
        switch (part) {
          case "products":
            label = "Sản phẩm";
            break;
          case "product":
            label = "Chi tiết sản phẩm";
            break;
          case "cart":
            label = "Giỏ hàng";
            break;
          case "checkout":
            label = "Thanh toán";
            break;
          case "orders":
            label = "Đơn hàng";
            break;
          case "login":
            label = "Đăng nhập";
            break;
          case "success":
            label = "Đặt hàng thành công";
            break;
          default:
            // Chuyển chữ cái đầu thành in hoa nếu không có mapping
            label = part.charAt(0).toUpperCase() + part.slice(1);
        }

        breadcrumbItems.push(
          <Breadcrumb.Item key={part} active>
            {label}
          </Breadcrumb.Item>
        );
      }
      // Nếu không phải phần cuối (vẫn là đường link)
      else {
        breadcrumbItems.push(
          <Breadcrumb.Item key={part} href={currentPath}>
            {part.charAt(0).toUpperCase() + part.slice(1)}
          </Breadcrumb.Item>
        );
      }
    });

    // Trả về component Breadcrumb với các item vừa tạo
    return (
      <Breadcrumb className="mt-3 mb-2 py-2 bg-light rounded px-3">
        {breadcrumbItems}
      </Breadcrumb>
    );
  };

  //
  // 7. XỬ LÝ TRƯỜNG HỢP ỨNG DỤNG ĐANG LOADING
  //
  if (loading) {
    return (
      <div
        className="text-center p-5 d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        {/* Spinner Bootstrap */}
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3">Đang tải ứng dụng...</p>
      </div>
    );
  }

  //
  // 8. XỬ LÝ TRƯỜNG HỢP CÓ LỖI XÁC THỰC (authError không rỗng)
  //
  if (authError) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh", padding: "2rem" }}
      >
        <Alert
          variant="danger"
          className="text-center"
          style={{ maxWidth: "500px" }}
        >
          <FaExclamationTriangle size={50} className="mb-3" />
          <Alert.Heading>Lỗi Xác Thực</Alert.Heading>
          <p>{authError}</p>
          <hr />
          <div className="d-flex justify-content-between">
            {/* Nút Thử Lại gọi handleRetryAuth */}
            <button
              className="btn btn-outline-danger"
              onClick={handleRetryAuth}
            >
              <FaSync className="me-2" /> Thử lại
            </button>
            {/* Nút Đăng Nhập Lại chuyển về trang login và xóa token cũ */}
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/store/login");
              }}
            >
              Đăng nhập lại
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  //
  // 9. GIAO DIỆN CHÍNH KHI ỨNG DỤNG ĐÃ XÁC THỰC HOÀN TẤT (loading=false, authError="")
  //
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Container để hiển thị toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header chung của trang store, truyền số lượng item trong cart, trạng thái auth và thông tin user */}
      <Header
        cartItemCount={cart.length}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />

      {/* Phần nội dung chính (flex-grow để đẩy footer xuống cuối trang) */}
      <main className="flex-grow-1">
        <Container>
          {/* Hiển thị breadcrumb tùy theo đường dẫn hiện tại */}
          <StoreBreadcrumb />
        </Container>

        {/* Cấu hình các route bên trong store */}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                isAuthenticated={isAuthenticated}
                addToCart={addToCart}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductList
                isAuthenticated={isAuthenticated}
                addToCart={addToCart}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductDetail
                isAuthenticated={isAuthenticated}
                addToCart={addToCart}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                updateCartItem={updateCartItem}
                removeCartItem={removeCartItem}
                clearCart={clearCart}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                cart={cart}
                clearCart={clearCart}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="/order/success"
            element={<OrderSuccess isAuthenticated={isAuthenticated} />}
          />
          <Route
            path="/orders"
            element={<Orders isAuthenticated={isAuthenticated} />}
          />
          <Route
            path="/login"
            element={
              <Login onLogin={handleLogin} isAuthenticated={isAuthenticated} />
            }
          />
          {/* Route fallback cho các đường dẫn không tồn tại (404) */}
          <Route
            path="*"
            element={
              <div className="text-center p-5">
                <h2>404 - Không tìm thấy trang</h2>
                <p>
                  Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/store")}
                >
                  Quay lại trang chủ
                </button>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Footer chung của trang store */}
      <Footer />
    </div>
  );
};

// Export component Store để sử dụng ở App.js hoặc nơi khác
export default Store;
