// Import React và các hook cần thiết
import React, { useState, useEffect } from "react";
// React: thư viện chính để xây dựng component
// useState: Hook để khai báo state bên trong functional component
// useEffect: Hook để thực hiện side-effects (gọi API, thiết lập event, …) khi component mount hoặc state/prop thay đổi

// Import các component từ thư viện React‑Bootstrap
import { Form, Button, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
// Form: thành phần chứa thẻ <form> với style và các tiện ích của Bootstrap
// Button: thành phần nút bấm (styled button) của Bootstrap
// Row, Col: hệ thống lưới (grid) của Bootstrap, chia bố cục thành hàng và cột
// Card: thành phần “thẻ” (card) để đóng khung nội dung với shadow và border
// Spinner: biểu tượng loading dạng xoay (spinner) của Bootstrap
// Alert: thành phần hiển thị thông báo (alert) với các biến thể như success, warning, danger

// Import icon FaImage từ thư viện react-icons (FontAwesome)
import { FaImage } from "react-icons/fa";
// FaImage: icon biểu diễn hình ảnh, dùng để show placeholder nếu load ảnh lỗi

// Import các hàm API liên quan đến product, category và supplier
import {
  createProduct, // Hàm POST tạo mới sản phẩm
  updateProduct, // Hàm PUT cập nhật sản phẩm theo id
  getCategories, // Hàm GET lấy danh sách các category
  getSuppliers, // Hàm GET lấy danh sách các supplier
} from "../services/api";

// Khai báo một hằng số chứa hình placeholder (SVG base64) hiển thị khi không có hình
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1687617b270%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1687617b270%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2230%22%20y%3D%2255%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";
// Đây là một SVG được mã hóa base64, hiển thị background màu xám và chữ “No Image”.

// Khai báo component ProductForm nhận vào hai prop:
// - editingProduct: nếu tồn tại (không null) thì đây là object product đang chỉnh sửa.
// - onSuccess: callback sẽ được gọi khi tạo mới hoặc cập nhật thành công để parent refresh danh sách.
const ProductForm = ({ editingProduct, onSuccess }) => {
  // State lưu trữ dữ liệu các trường trong form (chưa bao gồm ảnh)
  const [formData, setFormData] = useState({
    name: "", // Tên sản phẩm
    code: "", // Mã sản phẩm (có thể được tạo tự động nếu để trống)
    categoryId: "", // ID của category đã chọn
    supplierId: "", // ID của supplier đã chọn
    description: "", // Mô tả sản phẩm
    price: "", // Giá sản phẩm (kiểu number)
    quantity: "", // Số lượng sản phẩm (kiểu number)
    status: "active", // Trạng thái: "active" (đang bán) mặc định
  });

  // State lưu trữ các File object được chọn (mảng nhiều ảnh)
  const [images, setImages] = useState([]);
  // State lưu trữ mảng preview, mỗi phần tử có { url, name? hoặc id? } để render hình thumb
  const [imagePreview, setImagePreview] = useState([]);
  // State lưu thông tin lỗi liên quan đến việc load ảnh (nếu url sai)
  const [imageErrors, setImageErrors] = useState({});
  // State lưu lỗi validation cho các field text / number
  const [errors, setErrors] = useState({});
  // State báo đang submit (loading indicator trên nút Submit)
  const [loading, setLoading] = useState(false);
  // State lưu lỗi toàn cục khi submit (nhận từ API lỗi server)
  const [submitError, setSubmitError] = useState("");
  // State lưu mảng category lấy từ API
  const [categories, setCategories] = useState([]);
  // State lưu mảng supplier lấy từ API
  const [suppliers, setSuppliers] = useState([]);
  // State báo đang fetch dữ liệu ban đầu (categories và suppliers)
  const [fetchingData, setFetchingData] = useState(false);
  // State lưu lỗi khi fetch categories hoặc suppliers ban đầu
  const [fetchError, setFetchError] = useState("");

  //
  // useEffect đầu: load danh sách categories và suppliers khi component mount
  //
  useEffect(() => {
    // Định nghĩa async function để gọi API và set state
    const fetchData = async () => {
      setFetchingData(true); // Bật loading fetch dữ liệu
      setFetchError(""); // Reset fetchError trước khi gọi

      try {
        // —————————————————————
        // Fetch categories
        // —————————————————————
        let categoriesData = [];
        try {
          const categoriesResponse = await getCategories();
          // Nếu response.data tồn tại và là mảng, gán cho categoriesData
          if (categoriesResponse && categoriesResponse.data) {
            categoriesData = Array.isArray(categoriesResponse.data)
              ? categoriesResponse.data
              : [];
          }
        } catch (error) {
          // Nếu lỗi khi gọi getCategories()
          console.error("Error fetching categories:", error);
          // Thêm message lỗi vào fetchError
          setFetchError((prev) => prev + "Không thể tải danh mục. ");
        }

        // —————————————————————
        // Fetch suppliers
        // —————————————————————
        let suppliersData = [];
        try {
          const suppliersResponse = await getSuppliers();
          if (suppliersResponse && suppliersResponse.data) {
            suppliersData = Array.isArray(suppliersResponse.data)
              ? suppliersResponse.data
              : [];

            // Kiểm tra nếu suppliersResponse.data không phải mảng thì log warning
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

        // Set categories và suppliers vào state
        setCategories(categoriesData);
        setSuppliers(suppliersData);
      } catch (error) {
        // Nếu có lỗi tổng quát trong fetchData (mặc dù đã catch riêng bên trên)
        console.error("Error in fetchData:", error);
        setFetchError("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setFetchingData(false); // Tắt loading fetch
      }
    };

    fetchData(); // Gọi hàm fetchData ngay khi component mount
  }, []); // Mảng phụ thuộc rỗng: chỉ chạy 1 lần khi mount

  //
  // useEffect thứ hai: khi editingProduct thay đổi (khi người dùng mở form để sửa),
  //   set lại formData và imagePreview dựa trên editingProduct (object product cũ)
  //
  useEffect(() => {
    if (editingProduct) {
      // —————————————————————
      // Set các trường cơ bản vào formData
      // —————————————————————
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

      // —————————————————————
      // Xử lý imagePreview đối với các ảnh đã tồn tại (editingProduct.images)
      // —————————————————————
      if (
        editingProduct.images &&
        Array.isArray(editingProduct.images) &&
        editingProduct.images.length > 0
      ) {
        // Tạo mảng previews từ editingProduct.images, chứa { url, id }
        const previews = editingProduct.images.map((img) => ({
          url: img.url || PLACEHOLDER_IMAGE, // dùng url nếu có, nếu không dùng placeholder
          id: img.id, // lưu id của ảnh backend để gửi keepImageIds sau này
        }));
        setImagePreview(previews);
      }
    }
  }, [editingProduct]);
  // Chạy lại mỗi khi giá trị editingProduct thay đổi

  //
  // Hàm handleChange: xử lý khi user thay đổi giá trị trong các input (text, number, select, textarea)
  //
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Cập nhật formData: giữ các trường cũ, chỉ ghi đè trường có name = value mới
    setFormData({
      ...formData,
      [name]: value,
    });

    // Nếu trước đó đã có error ở field đó, xóa error khi user bắt đầu gõ lại
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  //
  // Hàm handleImageChange: khi user chọn file ảnh (input type="file" multiple)
  //
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Array.from: chuyển FileList thành mảng File để dễ thao tác

    if (files.length > 0) {
      setImages(files); // Lưu mảng File vào state images

      // Tạo mảng preview URLs cho các file mới:
      // dùng URL.createObjectURL(file) để tạo blob URL hiển thị tạm
      const newImagePreviews = files.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));

      setImagePreview(newImagePreviews);
    }
  };

  //
  // Hàm validateForm: kiểm tra tính hợp lệ của form (các field cần thiết)
  //   Trả về true nếu không có lỗi, false nếu có lỗi.
  //
  const validateForm = () => {
    const newErrors = {};

    // Kiểm tra tên sản phẩm không được để trống
    if (!formData.name.trim())
      newErrors.name = "Tên sản phẩm không được để trống";

    // Kiểm tra đã chọn categoryId chưa
    if (!formData.categoryId)
      newErrors.categoryId = "Vui lòng chọn loại sản phẩm";

    // Kiểm tra đã chọn supplierId chưa
    if (!formData.supplierId)
      newErrors.supplierId = "Vui lòng chọn nhà cung cấp";

    // Kiểm tra giá sản phẩm
    if (!formData.price) {
      newErrors.price = "Giá sản phẩm không được để trống";
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      // isNaN: kiểm tra giá trị không phải số
      newErrors.price = "Giá sản phẩm phải là số dương";
    }

    // Kiểm tra số lượng sản phẩm
    if (!formData.quantity) {
      newErrors.quantity = "Số lượng không được để trống";
    } else if (isNaN(formData.quantity) || Number(formData.quantity) < 0) {
      newErrors.quantity = "Số lượng phải là số không âm";
    }

    // Nếu đang thêm mới (editingProduct = null) và không có ảnh được chọn,
    // thì báo lỗi: phải chọn ít nhất 1 ảnh
    if (!editingProduct && images.length === 0) {
      newErrors.images = "Vui lòng chọn ít nhất một hình ảnh";
    }

    // Cập nhật state errors với newErrors
    setErrors(newErrors);

    // Trả về true nếu newErrors rỗng (không có lỗi), ngược lại false
    return Object.keys(newErrors).length === 0;
  };

  //
  // Hàm handleSubmit: khi user submit form (bấm nút “Thêm sản phẩm” hoặc “Cập nhật sản phẩm”)
  //
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form submit mặc định gây reload trang

    if (!validateForm()) return; // Nếu form không hợp lệ, không tiếp tục

    setLoading(true); // Bật loading indicator (khi submit)
    setSubmitError(""); // Reset lỗi submit cũ

    try {
      // Tạo FormData để gửi qua multipart/form-data (có thể kèm file ảnh)
      const formDataToSend = new FormData();

      // Đổ từng key,value trong formData vào FormData
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append images (nếu có):
      if (images.length > 0) {
        images.forEach((image) => {
          formDataToSend.append("images", image);
        });
      }

      // Nếu đang ở chế độ edit (editingProduct != null) và có hình preview cũ (tức img.id tồn tại),
      // ta cần gửi kèm danh sách ID ảnh cũ muốn giữ (ghi vào field "keepImages")
      if (editingProduct && imagePreview.length > 0) {
        // Lọc những preview có thuộc tính id (có nghĩa là hình cũ trên server)
        const keepImageIds = imagePreview
          .filter((img) => img.id) // Chỉ giữ các ảnh có id
          .map((img) => img.id); // Lấy mảng id

        if (keepImageIds.length > 0) {
          // Ghi mảng ID (stringified JSON) vào FormData key = "keepImages"
          formDataToSend.append("keepImages", JSON.stringify(keepImageIds));
        }
      }

      let response;
      if (editingProduct) {
        // Nếu edit: gọi API updateProduct(editingProduct.id, formDataToSend)
        response = await updateProduct(editingProduct.id, formDataToSend);
      } else {
        // Nếu thêm mới: gọi API createProduct(formDataToSend)
        response = await createProduct(formDataToSend);
      }

      // Nếu response.status = 201 (created) hoặc 200 (ok), gọi onSuccess
      if (response.status === 201 || response.status === 200) {
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      // setSubmitError: Hiển thị message lỗi lấy từ error.response.data.message hoặc message chung
      setSubmitError(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau"
      );
    } finally {
      setLoading(false); // Tắt loading indicator dù success hay fail
    }
  };

  //
  // Hàm handleRemoveImage: khi user bấm “Xóa” trên một thumbnail ảnh preview
  //
  const handleRemoveImage = (index) => {
    // Copy mảng imagePreview để thao tác (immutable)
    const newPreviews = [...imagePreview];
    newPreviews.splice(index, 1); // Xóa phần tử tại index
    setImagePreview(newPreviews);

    // Nếu là ảnh mới (không có thuộc tính id) thì cũng xóa tương ứng khỏi images array
    if (!editingProduct || !imagePreview[index].id) {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
  };

  //
  // Chuẩn bị suppliersList và categoriesList luôn là mảng (phòng trường hợp null/undefined)
  //
  const suppliersList = Array.isArray(suppliers) ? suppliers : [];
  const categoriesList = Array.isArray(categories) ? categories : [];

  //
  // Hàm getImageUrl: để xử lý URL image cũ trên server hoặc blob/data URL
  //
  const getImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;

    try {
      // Nếu url đã là blob URL (bắt đầu "blob:") hoặc data URL (bắt đầu "data:")
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
      }
      // Nếu url đã là URL tuyệt đối (http:// hoặc https://)
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      // Ngược lại, url là đường dẫn tương đối (ví dụ "/uploads/abc.jpg"), prepend host
      return `http://localhost:3000${url}`;
    } catch (error) {
      console.error("Error processing image URL:", error);
      return PLACEHOLDER_IMAGE;
    }
  };

  //
  // Hàm handleImageError: khi một thumbnail lỗi load, gán imageErrors[index] = true
  //
  const handleImageError = (index) => {
    setImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  // Phần return: render giao diện
  return (
    <div>
      {/* Nếu đang fetch dữ liệu ban đầu (categories & suppliers) */}
      {fetchingData ? (
        // Hiển thị spinner loading và thông báo
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : (
        // Nếu không đang fetch, hiển thị form
        <Form onSubmit={handleSubmit}>
          {/* Nếu có lỗi fetch categories/suppliers */}
          {fetchError && <Alert variant="warning">{fetchError}</Alert>}
          {/* Nếu có lỗi submit (từ API) */}
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          {/* Dòng 1: Tên & Mã sản phẩm */}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Tên sản phẩm <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text" // input type = text
                  name="name" // name field trong formData
                  value={formData.name} // value điều khiển bởi state formData.name
                  onChange={handleChange} // onChange gọi handleChange
                  isInvalid={!!errors.name} // isInvalid = true nếu errors.name != null
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                  {/* Hiển thị lỗi tương ứng nếu errors.name tồn tại */}
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

          {/*  Loại sản phẩm & Nhà cung cấp */}

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
                  {/* Placeholder option */}
                  <option value="">-- Chọn loại sản phẩm --</option>
                  {/* Lặp qua categoriesList để tạo option */}
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

          {/* Dòng 3: Giá & Số lượng */}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Giá <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number" // input type = number
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  isInvalid={!!errors.price}
                  min="0" // giá trị nhỏ nhất = 0
                  step="1000" // bước nhảy 1000 (ví dụ nhập 1000,2000,…)
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
                  min="0" // không cho nhập số âm
                />
                <Form.Control.Feedback type="invalid">
                  {errors.quantity}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Ô Mô tả sản phẩm (textarea) */}

          <Form.Group className="mb-3">
            <Form.Label>Mô tả sản phẩm</Form.Label>
            <Form.Control
              as="textarea" // as="textarea" để render thành thẻ <textarea>
              rows={3} // số dòng hiển thị = 3
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          {/* Ô chọn hình ảnh (file input) */}

          <Form.Group className="mb-3">
            <Form.Label>
              Hình ảnh sản phẩm{" "}
              {/* Nếu không phải edit (editingProduct = null), thì bắt buộc chọn ít nhất 1 ảnh */}
              {!editingProduct && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="file" // type=input file
              accept="image/*" // chỉ chấp nhận file image (png,jpg,…)
              multiple // cho phép chọn nhiều file
              onChange={handleImageChange} // gọi handleImageChange khi chọn file
              isInvalid={!!errors.images} // hiển thị border đỏ nếu errors.images tồn tại
            />
            <Form.Control.Feedback type="invalid">
              {errors.images}
            </Form.Control.Feedback>

            {/* Nếu có imagePreview (mảng không rỗng), hiển thị các thumbnail */}
            {imagePreview.length > 0 && (
              <div className="mt-3">
                <p>Hình ảnh đã chọn:</p>
                <Row>
                  {imagePreview.map((image, index) => (
                    <Col key={index} xs={6} md={3} className="mb-3">
                      <Card>
                        {imageErrors[index] ? (
                          // Nếu imageErrors[index] = true (ảnh lỗi load), hiển thị placeholder
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
                          // Ngược lại hiển thị ảnh thật
                          <Card.Img
                            variant="top"
                            src={getImageUrl(image.url)} // gọi getImageUrl xử lý url
                            style={{ height: "150px", objectFit: "cover" }}
                            onError={() => handleImageError(index)}
                            // Khi load hình lỗi, onError => handleImageError(index) đánh dấu imageErrors[index] = true
                          />
                        )}
                        <Card.Body className="p-2">
                          {/* Nút “Xóa” dưới mỗi thumbnail */}
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

          {/* Thẻ Select để chọn trạng thái */}

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {/* Option giá trị status tương ứng */}
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
              <option value="out_of_stock">Hết hàng</option>
            </Form.Select>
          </Form.Group>

          {/* Nút Submit: “Thêm sản phẩm” hoặc “Cập nhật sản phẩm” */}

          <div className="d-flex justify-content-end mt-4">
            <Button
              variant="primary"
              type="submit"
              disabled={loading} // Vô hiệu hóa nút khi đang loading
              className="d-flex align-items-center gap-2"
            >
              {/* Nếu loading = true, hiển thị Spinner */}
              {loading && <Spinner animation="border" size="sm" />}
              {/* Text trên nút thay đổi tùy thuộc editingProduct */}
              {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default ProductForm;
