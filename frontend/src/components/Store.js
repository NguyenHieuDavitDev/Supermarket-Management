import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Container, Breadcrumb, Alert } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaExclamationTriangle, FaSync } from "react-icons/fa";

// Import store components
import Header from "./store/Header";
import Footer from "./store/Footer";
import HomePage from "./store/HomePage";
import ProductList from "./store/ProductList";
import ProductDetail from "./store/ProductDetail";
import Cart from "./store/Cart";
import Checkout from "./store/Checkout";
import OrderSuccess from "./store/OrderSuccess";
import Orders from "./store/Orders";
import Login from "./store/Login";
import { checkAuth, getProducts } from "../services/api";

const Store = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [cart, setCart] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on load
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setLoading(true);
        setAuthError("");

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const response = await checkAuth();
            setIsAuthenticated(true);

            // Get user data from localStorage
            const userData = localStorage.getItem("user");
            if (userData) {
              try {
                setUser(JSON.parse(userData));
              } catch (parseError) {
                console.error("Failed to parse user data:", parseError);
                localStorage.removeItem("user");
              }
            }

            // Load cart data from localStorage
            const savedCart = localStorage.getItem("cart");
            if (savedCart) {
              try {
                setCart(JSON.parse(savedCart));
              } catch (parseError) {
                console.error("Failed to parse cart data:", parseError);
                localStorage.removeItem("cart");
              }
            }
          } catch (error) {
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
        console.error("Authentication check failed:", error);
        setAuthError("Lỗi xác thực. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [retryCount]);

  const handleRetryAuth = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
        toast.error("Không thể lưu giỏ hàng vào bộ nhớ. Vui lòng thử lại.");
      }
    } else if (cart.length === 0 && localStorage.getItem("cart")) {
      localStorage.removeItem("cart");
    }
  }, [cart]);

  // Add item to cart
  const addToCart = async (product, quantity) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để mua hàng");
      navigate("/store/login");
      return false;
    }

    if (!product || !product.id) {
      toast.error("Không thể thêm sản phẩm vào giỏ hàng");
      return false;
    }

    try {
      // Check if product is already in cart
      const existingItem = cart.find((item) => item.id === product.id);

      if (existingItem) {
        // Update quantity if already in cart
        const newQuantity = existingItem.quantity + quantity;

        // Check if we're not exceeding available quantity
        if (newQuantity > (product.quantity || 0)) {
          toast.warning(`Chỉ còn ${product.quantity} sản phẩm trong kho`);
          updateCartItem(product.id, product.quantity);
          return true;
        }

        updateCartItem(product.id, newQuantity);
        toast.success(
          `Đã cập nhật số lượng sản phẩm "${product.name}" trong giỏ hàng`
        );
      } else {
        // Add new item to cart
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

  // Update cart item quantity
  const updateCartItem = (itemId, newQuantity) => {
    if (!itemId) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId) {
          // Make sure we don't set quantity below 1 or above available quantity
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

  // Remove item from cart
  const removeCartItem = (itemId) => {
    if (!itemId) return;

    const itemToRemove = cart.find((item) => item.id === itemId);
    if (itemToRemove) {
      toast.info(`Đã xóa "${itemToRemove.name}" khỏi giỏ hàng`);
    }

    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));

    // If cart becomes empty, remove from localStorage
    if (cart.length === 1) {
      localStorage.removeItem("cart");
    }
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length > 0) {
      toast.info("Đã xóa tất cả sản phẩm khỏi giỏ hàng");
    }

    setCart([]);
    localStorage.removeItem("cart");
  };

  // Handle login
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setAuthError("");

    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to store user data:", error);
      toast.warning(
        "Không thể lưu thông tin người dùng vào bộ nhớ trình duyệt"
      );
    }

    toast.success("Đăng nhập thành công!");

    // Redirect to original destination if there was one
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");
    if (redirect) {
      navigate(`/store/${redirect}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCart([]);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");

    toast.info("Đã đăng xuất khỏi hệ thống");
    navigate("/store");
  };

  // Breadcrumb component
  const StoreBreadcrumb = () => {
    const path = location.pathname;

    if (path === "/") return null; // Don't show breadcrumbs on homepage

    const pathParts = path.split("/").filter((part) => part);
    const breadcrumbItems = [];

    // Add Home link
    breadcrumbItems.push(
      <Breadcrumb.Item key="home" href="/">
        Trang chủ
      </Breadcrumb.Item>
    );

    // Add each path part
    let currentPath = "";
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;

      // Last item (active)
      if (index === pathParts.length - 1) {
        let label = "";

        // Transform route name to readable text
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
            label = part.charAt(0).toUpperCase() + part.slice(1);
        }

        breadcrumbItems.push(
          <Breadcrumb.Item key={part} active>
            {label}
          </Breadcrumb.Item>
        );
      }
      // Intermediate items (clickable)
      else {
        breadcrumbItems.push(
          <Breadcrumb.Item key={part} href={currentPath}>
            {part.charAt(0).toUpperCase() + part.slice(1)}
          </Breadcrumb.Item>
        );
      }
    });

    return (
      <Breadcrumb className="mt-3 mb-2 py-2 bg-light rounded px-3">
        {breadcrumbItems}
      </Breadcrumb>
    );
  };

  if (loading) {
    return (
      <div
        className="text-center p-5 d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3">Đang tải ứng dụng...</p>
      </div>
    );
  }

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
            <button
              className="btn btn-outline-danger"
              onClick={handleRetryAuth}
            >
              <FaSync className="me-2" /> Thử lại
            </button>
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

  return (
    <div className="d-flex flex-column min-vh-100">
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

      <Header
        cartItemCount={cart.length}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-grow-1">
        <Container>
          <StoreBreadcrumb />
        </Container>

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

      <Footer />
    </div>
  );
};

export default Store;
