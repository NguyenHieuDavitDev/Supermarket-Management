import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { FaImage } from "react-icons/fa";
import {
  createProduct,
  updateProduct,
  getCategories,
  getSuppliers,
} from "../services/api";

// Default placeholder image
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1687617b270%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1687617b270%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2230%22%20y%3D%2255%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

const ProductForm = ({ editingProduct, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    categoryId: "",
    supplierId: "",
    description: "",
    price: "",
    quantity: "",
    status: "active",
  });

  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Load categories and suppliers data
  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      setFetchError("");
      try {
        // Fetch categories
        let categoriesData = [];
        try {
          const categoriesResponse = await getCategories();
          if (categoriesResponse && categoriesResponse.data) {
            categoriesData = Array.isArray(categoriesResponse.data)
              ? categoriesResponse.data
              : [];
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          setFetchError((prev) => prev + "Không thể tải danh mục. ");
        }

        // Fetch suppliers
        let suppliersData = [];
        try {
          const suppliersResponse = await getSuppliers();
          if (suppliersResponse && suppliersResponse.data) {
            suppliersData = Array.isArray(suppliersResponse.data)
              ? suppliersResponse.data
              : [];

            if (!Array.isArray(suppliersResponse.data)) {
              console.warn(
                "Suppliers data is not an array:",
                suppliersResponse.data
              );
            }
          }
        } catch (error) {
          console.error("Error fetching suppliers:", error);
          setFetchError((prev) => prev + "Không thể tải nhà cung cấp. ");
        }

        setCategories(categoriesData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error("Error in fetchData:", error);
        setFetchError("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, []);

  // Load product data when editing
  useEffect(() => {
    if (editingProduct) {
      // Set basic form data
      setFormData({
        name: editingProduct.name || "",
        code: editingProduct.code || "",
        categoryId: editingProduct.categoryId || "",
        supplierId: editingProduct.supplierId || "",
        description: editingProduct.description || "",
        price: editingProduct.price || "",
        quantity: editingProduct.quantity || "",
        status: editingProduct.status || "active",
      });

      // Handle image previews for existing images
      if (
        editingProduct.images &&
        Array.isArray(editingProduct.images) &&
        editingProduct.images.length > 0
      ) {
        const previews = editingProduct.images.map((img) => ({
          url: img.url || PLACEHOLDER_IMAGE,
          id: img.id,
        }));
        setImagePreview(previews);
      }
    }
  }, [editingProduct]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      setImages(files);

      // Create preview URLs
      const newImagePreviews = files.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));

      setImagePreview(newImagePreviews);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = "Tên sản phẩm không được để trống";
    if (!formData.categoryId)
      newErrors.categoryId = "Vui lòng chọn loại sản phẩm";
    if (!formData.supplierId)
      newErrors.supplierId = "Vui lòng chọn nhà cung cấp";

    if (!formData.price) {
      newErrors.price = "Giá sản phẩm không được để trống";
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = "Giá sản phẩm phải là số dương";
    }

    if (!formData.quantity) {
      newErrors.quantity = "Số lượng không được để trống";
    } else if (isNaN(formData.quantity) || Number(formData.quantity) < 0) {
      newErrors.quantity = "Số lượng phải là số không âm";
    }

    if (!editingProduct && images.length === 0) {
      newErrors.images = "Vui lòng chọn ít nhất một hình ảnh";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSubmitError("");

    try {
      const formDataToSend = new FormData();

      // Append form fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append images
      if (images.length > 0) {
        images.forEach((image) => {
          formDataToSend.append("images", image);
        });
      }

      // For edit mode, send specific image IDs to keep
      if (editingProduct && imagePreview.length > 0) {
        const keepImageIds = imagePreview
          .filter((img) => img.id) // Filter only existing images
          .map((img) => img.id);

        if (keepImageIds.length > 0) {
          formDataToSend.append("keepImages", JSON.stringify(keepImageIds));
        }
      }

      let response;
      if (editingProduct) {
        response = await updateProduct(editingProduct.id, formDataToSend);
      } else {
        response = await createProduct(formDataToSend);
      }

      if (response.status === 201 || response.status === 200) {
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      setSubmitError(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau"
      );
    } finally {
      setLoading(false);
    }
  };

  // Remove an image from preview
  const handleRemoveImage = (index) => {
    const newPreviews = [...imagePreview];
    newPreviews.splice(index, 1);
    setImagePreview(newPreviews);

    // Only update actual images array if this was a new image
    if (!editingProduct || !imagePreview[index].id) {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
  };

  // Ensure suppliers and categories are always arrays
  const suppliersList = Array.isArray(suppliers) ? suppliers : [];
  const categoriesList = Array.isArray(categories) ? categories : [];

  // Handle image URL to ensure proper path
  const getImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;

    try {
      // If URL is already a blob or data URL (for new file previews)
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
      }

      // Check if URL is already absolute
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }

      // Otherwise prepend the backend URL
      return `http://localhost:3000${url}`;
    } catch (error) {
      console.error("Error processing image URL:", error);
      return PLACEHOLDER_IMAGE;
    }
  };

  // Handle image error
  const handleImageError = (index) => {
    setImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  return (
    <div>
      {fetchingData ? (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          {fetchError && <Alert variant="warning">{fetchError}</Alert>}
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Tên sản phẩm <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mã sản phẩm</Form.Label>
                <Form.Control
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  isInvalid={!!errors.code}
                  placeholder="Để trống để sinh mã tự động"
                />
                <Form.Text className="text-muted">
                  Nếu để trống, hệ thống sẽ tự động tạo mã.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {errors.code}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Loại sản phẩm <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  isInvalid={!!errors.categoryId}
                >
                  <option value="">-- Chọn loại sản phẩm --</option>
                  {categoriesList.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.categoryId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nhà cung cấp <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  isInvalid={!!errors.supplierId}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliersList.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.supplierId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Giá <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  isInvalid={!!errors.price}
                  min="0"
                  step="1000"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.price}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Số lượng <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  isInvalid={!!errors.quantity}
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.quantity}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả sản phẩm</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Hình ảnh sản phẩm{" "}
              {!editingProduct && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              isInvalid={!!errors.images}
            />
            <Form.Control.Feedback type="invalid">
              {errors.images}
            </Form.Control.Feedback>

            {imagePreview.length > 0 && (
              <div className="mt-3">
                <p>Hình ảnh đã chọn:</p>
                <Row>
                  {imagePreview.map((image, index) => (
                    <Col key={index} xs={6} md={3} className="mb-3">
                      <Card>
                        {imageErrors[index] ? (
                          <div
                            style={{
                              height: "150px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#f8f9fa",
                              color: "#6c757d",
                            }}
                          >
                            <FaImage size={30} />
                          </div>
                        ) : (
                          <Card.Img
                            variant="top"
                            src={getImageUrl(image.url)}
                            style={{ height: "150px", objectFit: "cover" }}
                            onError={() => handleImageError(index)}
                          />
                        )}
                        <Card.Body className="p-2">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100"
                            onClick={() => handleRemoveImage(index)}
                          >
                            Xóa
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
              <option value="out_of_stock">Hết hàng</option>
            </Form.Select>
          </Form.Group>

          <div className="d-flex justify-content-end mt-4">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              {loading && <Spinner animation="border" size="sm" />}
              {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default ProductForm;
