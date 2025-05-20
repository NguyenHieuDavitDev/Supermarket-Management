import axios from "axios";

// Base URL for the API
const API_BASE_URL = "http://localhost:3000/api";
// Base URL for static assets (like images)
const ASSET_BASE_URL = "http://localhost:3000";

// Helper function to format image URLs
export const formatImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If it's already an absolute URL, return it as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's a relative path that starts with /, join it with the base URL
  if (imageUrl.startsWith("/")) {
    return `${ASSET_BASE_URL}${imageUrl}`;
  }

  // Otherwise, assume it's a relative path and prepend the asset base URL
  return `${ASSET_BASE_URL}/${imageUrl}`;
};

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Đảm bảo cookies được gửi cùng các request
});

// Thêm interceptor để gắn token vào mỗi request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý response và lỗi
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Auth
export const loginUser = (data) => API.post("/auth/login", data);
export const logoutUser = () => API.post("/auth/logout");
export const checkAuth = () => API.get("/auth/check");

// Users API
export const getUsers = () => API.get("/dashboard/users");
export const getUserById = (id) => API.get(`/dashboard/users/${id}`);
export const createUser = (data) => API.post("/dashboard/users", data);
export const updateUser = (id, data) => API.put(`/dashboard/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/dashboard/users/${id}`);

// Roles API
export const getRoles = () => API.get("/dashboard/roles");
export const createRole = (data) => API.post("/dashboard/roles", data);
export const deleteRole = (id) => API.delete(`/dashboard/roles/${id}`);
export const updateRole = (id, data) => API.put(`/dashboard/roles/${id}`, data);

// Categories API - quản lý (dashboard)
export const getCategories = () => API.get("/dashboard/categories");
export const getCategoryById = (id) => API.get(`/dashboard/categories/${id}`);
export const createCategory = (data) =>
  API.post("/dashboard/categories", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const updateCategory = (id, data) =>
  API.put(`/dashboard/categories/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const deleteCategory = (id) => API.delete(`/dashboard/categories/${id}`);

// Categories API - hiển thị public (store)
export const getPublicCategories = (params) =>
  // Fallback to dashboard categories since store endpoints appear to be unavailable
  API.get("/dashboard/categories", { params })
    .then((response) => {
      // Restructure response to match expected format
      let categories = response.data.categories || response.data || [];

      // Format image URLs for all categories
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

export const getPublicCategoryById = (id) =>
  // Fallback to dashboard endpoint
  API.get(`/dashboard/categories/${id}`)
    .then((response) => {
      const category = response.data;

      // Format image URL for the category
      if (category && category.image) {
        category.image = formatImageUrl(category.image);
      }

      return category;
    })
    .catch((error) => {
      console.error(`Error fetching category ${id}:`, error);
      return null;
    });

// Products API - hiển thị public (store)
export const getPublicProducts = (params) =>
  // Fallback to dashboard products since store endpoints appear to be unavailable
  API.get("/dashboard/products", { params })
    .then((response) => {
      // Extract products from the response
      let products = response.data.products || response.data || [];

      // Format image URLs for all products
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

export const getProductById = (id) =>
  // Fallback to dashboard product endpoint
  API.get(`/dashboard/products/${id}`)
    .then((response) => {
      const product = response.data;

      // Format image URLs for the product
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

// Suppliers API - quản lý nhà cung cấp (dashboard)
export const getSuppliers = (params) =>
  API.get("/dashboard/suppliers", { params }).then((response) => {
    // Ensure we're returning an array of suppliers
    return {
      ...response,
      data: Array.isArray(response.data.suppliers)
        ? response.data.suppliers
        : [],
    };
  });
export const getSupplierById = (id) => API.get(`/dashboard/suppliers/${id}`);
export const createSupplier = (data) =>
  API.post("/dashboard/suppliers", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const updateSupplier = (id, data) =>
  API.put(`/dashboard/suppliers/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const deleteSupplier = (id) => API.delete(`/dashboard/suppliers/${id}`);

// Products API
export const getProducts = (params) =>
  API.get("/dashboard/products", { params }).then((response) => {
    // Extract products and format their image URLs
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

export const getProduct = (id) =>
  API.get(`/dashboard/products/${id}`).then((response) => {
    // Format image URLs for the product
    const product = response.data;
    if (product && Array.isArray(product.images)) {
      product.images = product.images.map((img) => ({
        ...img,
        url: formatImageUrl(img.url),
      }));
    }
    return response;
  });

export const createProduct = (productData) =>
  API.post("/dashboard/products", productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const updateProduct = (id, productData) =>
  API.put(`/dashboard/products/${id}`, productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const deleteProduct = (id) => API.delete(`/dashboard/products/${id}`);
export const restoreProduct = (id) =>
  API.patch(`/dashboard/products/${id}/restore`);

// Orders API
export const getOrders = (params) => API.get("/dashboard/orders", { params });

export const searchOrders = (params) =>
  API.get("/dashboard/orders/search", { params });

export const getOrderById = (id) => API.get(`/dashboard/orders/${id}`);

export const createOrder = (orderData) =>
  API.post("/dashboard/orders", orderData);

export const updateOrder = (id, orderData) =>
  API.put(`/dashboard/orders/${id}`, orderData);

export const deleteOrder = (id) => API.delete(`/dashboard/orders/${id}`);

export const restoreOrder = (id) =>
  API.patch(`/dashboard/orders/${id}/restore`);

export const updateOrderStatus = (id, status) =>
  API.patch(`/dashboard/orders/${id}/status`, { status });

export const updatePaymentStatus = (id, paymentStatus) =>
  API.patch(`/dashboard/orders/${id}/payment`, { paymentStatus });

export default API;
