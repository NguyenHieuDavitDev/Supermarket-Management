// Import thư viện axios để thực hiện các HTTP request
import axios from "axios";

// Base URL cho API (tất cả endpoint sẽ bắt đầu bằng đường dẫn này)
const API_BASE_URL = "http://localhost:3000/api";

// Base URL cho tài nguyên tĩnh (images, files, v.v.), thường trỏ đến thư mục public
const ASSET_BASE_URL = "http://localhost:3000";

// Helper function: chuyển một đường dẫn ảnh (imageUrl) thành URL tuyệt đối
export const formatImageUrl = (imageUrl) => {
  // Nếu không có imageUrl hoặc rỗng, trả về null
  if (!imageUrl) return null;

  // Nếu imageUrl đã là URL tuyệt đối (bắt đầu bằng http:// hoặc https://), giữ nguyên
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Nếu imageUrl bắt đầu bằng dấu “/” (relative path đã có slash đầu),
  // ghép với ASSET_BASE_URL, ví dụ "/uploads/img.jpg" -> "http://localhost:3000/uploads/img.jpg"
  if (imageUrl.startsWith("/")) {
    return `${ASSET_BASE_URL}${imageUrl}`;
  }

  // Ngược lại, giả định imageUrl là relative path không bắt đầu dấu “/”,
  // thêm dấu “/” giữa ASSET_BASE_URL và imageUrl
  return `${ASSET_BASE_URL}/${imageUrl}`;
};

// Tạo một instance axios với cấu hình mặc định
const API = axios.create({
  baseURL: API_BASE_URL, // Mọi request sẽ mặc định gửi đến http://localhost:3000/api/...
  withCredentials: true, // Đảm bảo gửi cookie (như session) kèm theo request
});

// Thêm request interceptor để tự động gắn token (nếu có) vào header Authorization
API.interceptors.request.use(
  (config) => {
    // Lấy token (JWT) đã lưu trong localStorage
    const token = localStorage.getItem("token");
    if (token) {
      // Nếu tồn tại token, thêm vào header Authorization: "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Nếu có lỗi trong khâu tạo request, reject promise
    return Promise.reject(error);
  }
);

// Thêm response interceptor để log lỗi và xử lý lỗi chung
API.interceptors.response.use(
  (response) => {
    // Nếu response thành công (status 2xx), trả về response
    return response;
  },
  (error) => {
    // Nếu response lỗi (status không 2xx), in ra console để debug
    console.error("API Error:", error.response?.data || error.message);
    // Reject promise để cho caller xử lý
    return Promise.reject(error);
  }
);

/*
  
  SECTION: API Auth (Xác thực)
  
*/

// Hàm loginUser: gửi POST đến /auth/login với dữ liệu login (email/password)
//   -> Trả về một promise axios
export const loginUser = (data) => API.post("/auth/login", data);

// Hàm logoutUser: gửi POST đến /auth/logout để logout
export const logoutUser = () => API.post("/auth/logout");

// Hàm checkAuth: gửi GET đến /auth/check để kiểm tra token còn hợp lệ hay không
export const checkAuth = () => API.get("/auth/check");

/*
  
  SECTION: Users API (Quản lý User trên Dashboard)
  
*/

// getUsers: GET /dashboard/users => trả về tất cả user
export const getUsers = () => API.get("/dashboard/users");

// getUserById: GET /dashboard/users/:id => lấy user theo id
export const getUserById = (id) => API.get(`/dashboard/users/${id}`);

// createUser: POST /dashboard/users với dữ liệu formData (có thể kèm file avatar)
//   axios tự động gán header Content-Type: multipart/form-data nếu dữ liệu là FormData
export const createUser = (data) => API.post("/dashboard/users", data);

// updateUser: PUT /dashboard/users/:id với formData (chỉnh sửa user, có thể đổi avatar)
//   PUT thường dùng để thay thế toàn bộ hoặc cập nhật toàn bộ record
export const updateUser = (id, data) => API.put(`/dashboard/users/${id}`, data);

// deleteUser: DELETE /dashboard/users/:id => xóa user theo id
export const deleteUser = (id) => API.delete(`/dashboard/users/${id}`);

/*
  
  SECTION: Roles API (Quản lý Role trên Dashboard)
  
*/

// getRoles: GET /dashboard/roles => trả về tất cả role
export const getRoles = () => API.get("/dashboard/roles");

// createRole: POST /dashboard/roles với JSON dữ liệu { name: ... }
export const createRole = (data) => API.post("/dashboard/roles", data);

// deleteRole: DELETE /dashboard/roles/:id => xóa role theo id
export const deleteRole = (id) => API.delete(`/dashboard/roles/${id}`);

// updateRole: PUT /dashboard/roles/:id với JSON dữ liệu cập nhật
export const updateRole = (id, data) => API.put(`/dashboard/roles/${id}`, data);

/*
  SECTION: Categories API (Quản lý Category Dashboard)
*/

// getCategories: GET /dashboard/categories => trả về danh sách category dashboard
export const getCategories = () => API.get("/dashboard/categories");

// getCategoryById: GET /dashboard/categories/:id => lấy detail category theo id
export const getCategoryById = (id) => API.get(`/dashboard/categories/${id}`);

// createCategory: POST /dashboard/categories với FormData (multipart/form-data),
//   dùng để upload ảnh category (key "image", value là File).
export const createCategory = (data) =>
  API.post("/dashboard/categories", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// updateCategory: PUT /dashboard/categories/:id với FormData,
//   tương tự createCategory nhưng dùng phương thức PUT để cập nhật
export const updateCategory = (id, data) =>
  API.put(`/dashboard/categories/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// deleteCategory: DELETE /dashboard/categories/:id => xóa category
export const deleteCategory = (id) => API.delete(`/dashboard/categories/${id}`);

/*
  
  SECTION: Categories API - Public (dành cho Store hiển thị)
   
  Lưu ý: Hiện chưa có endpoint riêng cho store, dùng fallback về Dashboard
*/

// getPublicCategories: GET /dashboard/categories?params => trả về categories:
//   • Trả về object { categories } (đã format image URLs).
//   • Nếu lỗi, catch và trả về { categories: [] }.
export const getPublicCategories = (params) =>
  // Gọi fallback: GET /dashboard/categories với params (page, limit, search, v.v.)
  API.get("/dashboard/categories", { params })
    .then((response) => {
      // response.data.categories hoặc response.data (mảng)
      let categories = response.data.categories || response.data || [];

      // Format đường dẫn image cho từng category
      categories = categories.map((category) => ({
        ...category,
        image: category.image ? formatImageUrl(category.image) : null,
      }));

      return { categories };
    })
    .catch((error) => {
      console.error("Error fetching public categories:", error);
      return { categories: [] };
    });

// getPublicCategoryById: GET một category chi tiết:
//
//   • Gọi /dashboard/categories/:id
//   • Format image URL cho category nếu có
//   • Nếu lỗi, catch và trả về null
export const getPublicCategoryById = (id) =>
  API.get(`/dashboard/categories/${id}`)
    .then((response) => {
      const category = response.data;
      if (category && category.image) {
        category.image = formatImageUrl(category.image);
      }
      return category;
    })
    .catch((error) => {
      console.error(`Error fetching category ${id}:`, error);
      return null;
    });

/*
  
  SECTION: Products API - Public (dành cho Store hiển thị)
  
  Tương tự như categories, fallback về Dashboard products endpoint
*/

// getPublicProducts: GET /dashboard/products?params => trả về:
//   • { products, totalPages, totalItems }
//   • products: mảng sản phẩm đã format URL ảnh
//   • Nếu lỗi, catch và trả về mặc định { products: [], totalPages:1, totalItems:0 }
export const getPublicProducts = (params) =>
  API.get("/dashboard/products", { params })
    .then((response) => {
      // Lấy mảng products: response.data.products hoặc response.data (nếu không có products key)
      let products = response.data.products || response.data || [];

      // Format đường dẫn cho tất cả ảnh trong product.images
      products = products.map((product) => ({
        ...product,
        images: Array.isArray(product.images)
          ? product.images.map((img) => ({
              ...img,
              url: formatImageUrl(img.url),
            }))
          : [],
      }));

      return {
        products,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.totalItems || 0,
      };
    })
    .catch((error) => {
      console.error("Error fetching public products:", error);
      return { products: [], totalPages: 1, totalItems: 0 };
    });

// getProductById: GET /dashboard/products/:id => trả về detail 1 product
//   • Format ảnh trong product.images nếu có
//   • Nếu lỗi, catch và trả về null
export const getProductById = (id) =>
  API.get(`/dashboard/products/${id}`)
    .then((response) => {
      const product = response.data;
      if (product && Array.isArray(product.images)) {
        product.images = product.images.map((img) => ({
          ...img,
          url: formatImageUrl(img.url),
        }));
      }
      return product;
    })
    .catch((error) => {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    });

/*
  ==========================
  SECTION: Suppliers API - Quản lý nhà cung cấp Dashboard
  ==========================
*/

// getSuppliers: GET /dashboard/suppliers?params => trả về danh sách supplier
//   • Trả về một object response, nhưng override response.data thành mảng response.data.suppliers (nếu có).
//   • Nếu response.data.suppliers không phải mảng, mặc định trả về [].
export const getSuppliers = (params) =>
  API.get("/dashboard/suppliers", { params }).then((response) => {
    return {
      ...response,
      data: Array.isArray(response.data.suppliers)
        ? response.data.suppliers
        : [],
    };
  });

// getSupplierById: GET /dashboard/suppliers/:id => lấy chi tiết nhà cung cấp theo id
export const getSupplierById = (id) => API.get(`/dashboard/suppliers/${id}`);

// createSupplier: POST /dashboard/suppliers với FormData (multipart/form-data) để upload logo, các trường text khác
export const createSupplier = (data) =>
  API.post("/dashboard/suppliers", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// updateSupplier: PUT /dashboard/suppliers/:id với FormData (cập nhật thông tin và logo)
export const updateSupplier = (id, data) =>
  API.put(`/dashboard/suppliers/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// deleteSupplier: DELETE /dashboard/suppliers/:id => xóa nhà cung cấp
export const deleteSupplier = (id) => API.delete(`/dashboard/suppliers/${id}`);

/*
  SECTION: Products API - Quản lý sản phẩm Dashboard
*/

// getProducts: GET /dashboard/products?params => trả về danh sách sản phẩm
//   • Sau khi nhận response, format URL cho tất cả ảnh trong response.data.products
export const getProducts = (params) =>
  API.get("/dashboard/products", { params }).then((response) => {
    if (response.data && response.data.products) {
      response.data.products = response.data.products.map((product) => ({
        ...product,
        images: Array.isArray(product.images)
          ? product.images.map((img) => ({
              ...img,
              url: formatImageUrl(img.url),
            }))
          : [],
      }));
    }
    return response;
  });

// getProduct: GET /dashboard/products/:id => lấy detail một sản phẩm
//   • Sau khi nhận response, format URL cho tất cả ảnh trong response.data.images
export const getProduct = (id) =>
  API.get(`/dashboard/products/${id}`).then((response) => {
    const product = response.data;
    if (product && Array.isArray(product.images)) {
      product.images = product.images.map((img) => ({
        ...img,
        url: formatImageUrl(img.url),
      }));
    }
    return response;
  });

// createProduct: POST /dashboard/products với FormData (upload ảnh, trường text, số lượng, v.v.)
export const createProduct = (productData) =>
  API.post("/dashboard/products", productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// updateProduct: PUT /dashboard/products/:id với FormData (cập nhật info + ảnh)
export const updateProduct = (id, productData) =>
  API.put(`/dashboard/products/${id}`, productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// deleteProduct: DELETE /dashboard/products/:id => xóa sản phẩm
export const deleteProduct = (id) => API.delete(`/dashboard/products/${id}`);

// restoreProduct: PATCH /dashboard/products/:id/restore => khôi phục 1 sản phẩm đã xóa
export const restoreProduct = (id) =>
  API.patch(`/dashboard/products/${id}/restore`);

/*
  SECTION: Orders API (Quản lý đơn hàng Dashboard)
*/

// getOrders: GET /dashboard/orders?params => lấy danh sách đơn hàng (có thể phân trang, filter, v.v.)
export const getOrders = (params) => API.get("/dashboard/orders", { params });

// searchOrders: GET /dashboard/orders/search?params => tìm kiếm đơn hàng theo từ khóa (query params)
export const searchOrders = (params) =>
  API.get("/dashboard/orders/search", { params });

// getOrderById: GET /dashboard/orders/:id => lấy chi tiết một đơn hàng theo id
export const getOrderById = (id) => API.get(`/dashboard/orders/${id}`);

// createOrder: POST /dashboard/orders với JSON hoặc FormData (tùy backend), để tạo đơn hàng
export const createOrder = (orderData) =>
  API.post("/dashboard/orders", orderData);

// updateOrder: PUT /dashboard/orders/:id => cập nhật thông tin đơn hàng
export const updateOrder = (id, orderData) =>
  API.put(`/dashboard/orders/${id}`, orderData);

// deleteOrder: DELETE /dashboard/orders/:id => xóa đơn hàng
export const deleteOrder = (id) => API.delete(`/dashboard/orders/${id}`);

// restoreOrder: PATCH /dashboard/orders/:id/restore => khôi phục một đơn đã xóa
export const restoreOrder = (id) =>
  API.patch(`/dashboard/orders/${id}/restore`);

// updateOrderStatus: PATCH /dashboard/orders/:id/status với { status } => cập nhật trạng thái đơn (pending/processing/completed/cancelled)
export const updateOrderStatus = (id, status) =>
  API.patch(`/dashboard/orders/${id}/status`, { status });

// updatePaymentStatus: PATCH /dashboard/orders/:id/payment với { paymentStatus } => cập nhật trạng thái thanh toán (paid/unpaid/refunded)
export const updatePaymentStatus = (id, paymentStatus) =>
  API.patch(`/dashboard/orders/${id}/payment`, { paymentStatus });

export default API;
