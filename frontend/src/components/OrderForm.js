import React, { useState, useEffect, useCallback } from "react";
// import React: thư viện chính để xây dựng UI bằng React.
// useState: Hook để khai báo state trong functional component.
// useEffect: Hook để thực hiện side-effects (gọi API, cập nhật DOM) khi component render hoặc khi dependencies thay đổi.
// useCallback: Hook để “ghi nhớ” (memoize) một hàm và chỉ tái tạo lại khi dependencies thay đổi, giúp tối ưu hiệu năng.

import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Table,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
// Form: component bao bọc thẻ <form> với style Bootstrap.
// Button: component nút bấm styled Bootstrap.
// Row, Col: hệ thống lưới (grid) của Bootstrap, tạo hàng (Row) và cột (Col).
// Card: component “thẻ” (card) để đóng khung nội dung, với header và body.
// Table: component bảng (table) có style Bootstrap (striped, hover).
// Alert: component hiển thị thông báo (alert) với nhiều biến thể (danger, info, v.v.).
// Spinner: component biểu tượng xoay (loading) của Bootstrap.
// InputGroup: component gom input và button vào cùng một nhóm (ví dụ: ô tìm kiếm + nút search).

import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
// FaPlus: icon dấu cộng (“+”), dùng cho nút “Thêm”.
// FaTrash: icon thùng rác (“Delete”), dùng cho nút xóa.
// FaSearch: icon kính lúp (“Search”), dùng cho ô tìm kiếm.
// FaEdit: icon bút chì (“Edit”), dùng cho nút chỉnh sửa.
// FaSave: icon đĩa mềm (“Save”), dùng cho nút lưu item.
// FaTimes: icon dấu “X”, dùng cho nút hủy/chặn.

import {
  createOrder,
  updateOrder,
  getProducts,
  searchOrders,
} from "../services/api";
// createOrder: hàm gửi POST tạo đơn hàng mới.
// updateOrder: hàm gửi PUT cập nhật đơn hàng theo ID.
// getProducts: hàm GET lấy danh sách sản phẩm (dùng cho phần chọn sản phẩm).
// searchOrders: hàm GET tìm kiếm đơn hàng, ở đây tái sử dụng để tìm thông tin khách hàng.

import { useNavigate } from "react-router-dom";
// useNavigate: Hook từ React Router để điều hướng (navigation) giữa các route.

import Select from "react-select";
// Select: component dropdown nâng cao (styled) từ thư viện react-select.

import AsyncSelect from "react-select/async";
// AsyncSelect: phiên bản của react-select hỗ trợ tải options bất đồng bộ (async).

const OrderForm = ({ editingOrder, onSuccess }) => {
  // Định nghĩa functional component OrderForm.
  // Prop editingOrder: nếu không null, đây là object đơn hàng đang được sửa.
  // Prop onSuccess: callback được gọi khi lưu đơn thành công (parent có thể đóng modal hoặc chuyển hướng).

  const navigate = useNavigate();
  // Khai báo navigate: hàm điều hướng sang route khác (ví dụ navigate("/orders")).

  // State formData lưu thông tin cơ bản của đơn hàng (khách hàng, ngày, status, thanh toán, v.v.)
  const [formData, setFormData] = useState({
    customerName: "", // Tên khách hàng
    customerPhone: "", // Số điện thoại khách hàng
    customerEmail: "", // Email khách hàng
    customerAddress: "", // Địa chỉ khách hàng
    orderDate: new Date(), // Ngày tạo đơn (mặc định là ngày giờ hiện tại)
    notes: "", // Ghi chú chung cho đơn hàng
    status: "pending", // Trạng thái đơn hàng (pending, processing, completed, cancelled, refunded)
    paymentStatus: "unpaid", // Trạng thái thanh toán (unpaid, partially_paid, paid)
    paymentMethod: "", // Phương thức thanh toán (text)
    shippingMethod: "", // Phương thức vận chuyển (text)
    discount: 0, // Giảm giá cho toàn đơn (số tiền)
    tax: 0, // Thuế cho toàn đơn (số tiền)
  });

  // State items lưu mảng các sản phẩm (order items) trong đơn hàng
  const [items, setItems] = useState([]);
  // State selectedProduct lưu sản phẩm đang được chọn từ AsyncSelect
  const [selectedProduct, setSelectedProduct] = useState(null);
  // State quantity lưu số lượng sản phẩm đang thêm/sửa
  const [quantity, setQuantity] = useState(1);
  // State price lưu đơn giá sản phẩm (có thể lấy mặc định từ selectedProduct)
  const [price, setPrice] = useState(0);
  // State itemDiscount lưu phần giảm giá dành riêng cho một dòng sản phẩm
  const [itemDiscount, setItemDiscount] = useState(0);
  // State itemNotes lưu ghi chú cho riêng dòng sản phẩm
  const [itemNotes, setItemNotes] = useState("");
  // State editingItemIndex lưu index của item đang được chỉnh sửa (-1 nếu không chỉnh sửa)
  const [editingItemIndex, setEditingItemIndex] = useState(-1);

  // State loading báo trạng thái đang load dữ liệu (nếu cần trong tương lai)
  const [loading, setLoading] = useState(false);
  // State submitting báo trạng thái đang gửi form (gọi API tạo/cập nhật)
  const [submitting, setSubmitting] = useState(false);
  // State error lưu lỗi chung (validation hoặc API error)
  const [error, setError] = useState("");
  // State saveSuccess báo đã lưu thành công (show alert success)
  const [saveSuccess, setSaveSuccess] = useState(false);

  /*
    Hàm calcSubTotal: tính tổng tiền hàng trước giảm giá và thuế.
    Dùng items.reduce: lặp qua mảng items, cộng dồn item.total vào sum.
    item.total đã được tính sẵn = price * quantity - discount cho dòng đó.
  */
  const calcSubTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  /*
    Hàm calcGrandTotal: tính tổng tiền thanh toán cuối cùng, 
    = subtotal - discount (toàn đơn) + tax (toàn đơn).
  */
  const calcGrandTotal = () => {
    return (
      calcSubTotal() -
      (parseFloat(formData.discount) || 0) +
      (parseFloat(formData.tax) || 0)
    );
  };

  /*
    useEffect: khi editingOrder thay đổi (mount lần đầu hoặc cập nhật prop),
    nếu editingOrder tồn tại, set lại formData và items để hiển thị form chỉnh sửa.
  */
  useEffect(() => {
    if (editingOrder) {
      // Gán thông tin cơ bản của editingOrder vào state formData
      setFormData({
        customerName: editingOrder.customerName || "",
        customerPhone: editingOrder.customerPhone || "",
        customerEmail: editingOrder.customerEmail || "",
        customerAddress: editingOrder.customerAddress || "",
        orderDate: editingOrder.orderDate
          ? new Date(editingOrder.orderDate) // Chuyển chuỗi ISO thành Date object
          : new Date(),
        notes: editingOrder.notes || "",
        status: editingOrder.status || "pending",
        paymentStatus: editingOrder.paymentStatus || "unpaid",
        paymentMethod: editingOrder.paymentMethod || "",
        shippingMethod: editingOrder.shippingMethod || "",
        discount: editingOrder.discount || 0,
        tax: editingOrder.tax || 0,
      });

      // Nếu editingOrder.items là mảng, chuyển nó thành định dạng phù hợp với state items
      if (editingOrder.items && Array.isArray(editingOrder.items)) {
        const formattedItems = editingOrder.items.map((item) => ({
          productId: item.productId,
          productName:
            item.productName || (item.product && item.product.name) || "",
          productCode:
            item.productCode || (item.product && item.product.code) || "",
          quantity: item.quantity || 1,
          price: item.price || 0,
          discount: item.discount || 0,
          total:
            item.total || item.price * item.quantity - (item.discount || 0),
          notes: item.notes || "",
        }));
        setItems(formattedItems);
      }
    }
  }, [editingOrder]);
  // Chạy mỗi khi prop editingOrder thay đổi

  /*
    Hàm handleChange: xử lý event onChange cho các input trong form chung (Form.Control, Form.Select)
    e.target.name: tên trường (ví dụ: "customerName", "status", "discount", "tax", v.v.)
    e.target.value: giá trị mới user nhập.
    setFormData: giữ nguyên các trường khác, chỉ ghi đè trường có [name] = value.
  */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
    Hàm handleDateChange: xử lý khi input type="datetime-local" thay đổi (chọn ngày giờ).
    e.target.value: chuỗi ở định dạng "YYYY-MM-DDTHH:mm".
    new Date(e.target.value): tạo Date object từ chuỗi đó.
  */
  const handleDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      orderDate: new Date(e.target.value),
    }));
  };

  /*
    Hàm formatDateForInput: định dạng Date object thành chuỗi "YYYY-MM-DDTHH:mm"
    để set value cho <input type="datetime-local">.
  */
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Tháng từ 0-11, +1 rồi padStart 2 chữ số
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /*
    Hàm loadProducts: được sử dụng bởi AsyncSelect để tải danh sách products bất đồng bộ khi user gõ.
    inputValue: chuỗi user gõ vào ô tìm kiếm.
    getProducts({ search: inputValue, limit: 20 }): gọi API lấy mảng products.
    response.data.products: mảng sản phẩm, mỗi sản phẩm có fields: id, name, code, price, v.v.
    map thành định dạng { value, label, price, name, code, product } phù hợp với react-select.
    Trả về mảng options cho AsyncSelect.
  */
  const loadProducts = async (inputValue) => {
    try {
      const response = await getProducts({
        search: inputValue,
        limit: 20,
      });

      return response.data.products.map((product) => ({
        value: product.id,
        label: `${product.name} (${product.code})`,
        price: product.price,
        name: product.name,
        code: product.code,
        product,
      }));
    } catch (error) {
      console.error("Error loading products:", error);
      return [];
    }
  };

  /*
    Hàm addOrderItem: thêm hoặc cập nhật sản phẩm trong mảng items:
    Nếu chưa chọn selectedProduct, setError và return.
    Nếu quantity <= 0 hoặc price <= 0, setError và return.
    Tính tổng (total) = price * quantity - itemDiscount.
    Tạo object newItem chứa fields: productId, productName, productCode, quantity, price, discount, total, notes.
    Nếu editingItemIndex >= 0 => đang edit item: gán newItem vào vị trí đó trong mảng items.
    Nếu editingItemIndex < 0 => đang thêm mới: dùng spread [...items, newItem].
    Reset các input item về mặc định, xóa lỗi (setError("")).
  */
  const addOrderItem = () => {
    if (!selectedProduct) {
      setError("Vui lòng chọn sản phẩm");
      return;
    }

    if (!quantity || quantity <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return;
    }

    if (!price || price <= 0) {
      setError("Giá phải lớn hơn 0");
      return;
    }

    const total = price * quantity - (itemDiscount || 0);

    const newItem = {
      productId: selectedProduct.value,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      quantity: Number(quantity),
      price: Number(price),
      discount: Number(itemDiscount || 0),
      total,
      notes: itemNotes,
    };

    if (editingItemIndex >= 0) {
      // Cập nhật item đang edit
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = newItem;
      setItems(updatedItems);
      setEditingItemIndex(-1);
    } else {
      // Thêm mới item
      setItems([...items, newItem]);
    }

    // Reset input item
    setSelectedProduct(null);
    setQuantity(1);
    setPrice(0);
    setItemDiscount(0);
    setItemNotes("");
    setError("");
  };

  /*
    Hàm editItem: khi user bấm “Chỉnh sửa” trên một dòng item trong bảng,
    index: vị trí item trong mảng items đang hiển thị.
    Lấy item từ items[index], set các state input tạm (selectedProduct, quantity, price, itemDiscount, itemNotes),
      và set editingItemIndex = index để biết đang edit dòng nào.
  */
  const editItem = (index) => {
    const item = items[index];
    setSelectedProduct({
      value: item.productId,
      label: `${item.productName} (${item.productCode})`,
      name: item.productName,
      code: item.productCode,
      price: item.price,
    });
    setQuantity(item.quantity);
    setPrice(item.price);
    setItemDiscount(item.discount);
    setItemNotes(item.notes || "");
    setEditingItemIndex(index);
  };

  /*
    Hàm removeItem: xóa item tại vị trí index khỏi mảng items.
    Dùng spread để tạo mảng mới, splice loại phần tử tại index, rồi setItems(updatedItems).
  */
  const removeItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  /*
    Hàm cancelEdit: hủy việc chỉnh sửa item,
    Reset các input item về giá trị mặc định, set editingItemIndex = -1.
  */
  const cancelEdit = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setPrice(0);
    setItemDiscount(0);
    setItemNotes("");
    setEditingItemIndex(-1);
  };

  /*
    Hàm handleProductSelect: khi user chọn một option từ AsyncSelect,
    selected: object { value, label, price, name, code, product } hoặc null nếu clear lựa chọn.
    Nếu selected tồn tại, set price mặc định = selected.price, ngược lại set price = 0.
  */
  const handleProductSelect = (selected) => {
    setSelectedProduct(selected);
    if (selected) {
      setPrice(selected.price || 0);
    } else {
      setPrice(0);
    }
  };

  /*
    Hàm formatCurrency: định dạng số thành chuỗi tiền tệ VND (ví dụ "₫1.000").
    Sử dụng Intl.NumberFormat với locale "vi-VN" và style "currency", currency "VND".
  */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  /*
    Hàm validateForm: kiểm tra trước khi submit form:
    Kiểm tra customerName không rỗng.
    Kiểm tra customerPhone không rỗng.
    Kiểm tra items.length > 0 (phải có ít nhất 1 sản phẩm).
    Nếu bất kỳ điều kiện nào không thỏa mãn, gán setError thông báo và return false.
    Nếu tất cả hợp lệ, return true.
  */
  const validateForm = () => {
    if (!formData.customerName.trim()) {
      setError("Vui lòng nhập tên khách hàng");
      return false;
    }

    if (!formData.customerPhone.trim()) {
      setError("Vui lòng nhập số điện thoại khách hàng");
      return false;
    }

    if (items.length === 0) {
      setError("Vui lòng thêm ít nhất một sản phẩm vào đơn hàng");
      return false;
    }

    return true;
  };

  /*
    Hàm handleSubmit: khi user bấm nút “Tạo đơn hàng” hoặc “Cập nhật đơn hàng”:
    e.preventDefault(): ngăn reload trang khi submit form.
    Nếu validateForm() trả false, dừng hàm.
    setSubmitting(true), setError(""), setSaveSuccess(false) để chuẩn bị trạng thái loading và xóa thông báo lỗi/cũ.
    Tạo object orderData = {...formData, items, orderDate: ISO string}.
    Nếu editingOrder tồn tại: gọi updateOrder(editingOrder.id, orderData).
      Ngược lại: gọi createOrder(orderData).
    Khi API thành công: setSaveSuccess(true) hiển thị Alert thành công. Sau 1.5s, 
      nếu onSuccess tồn tại thì gọi onSuccess(response.data.order), 
      ngược lại điều hướng navigate("/orders") về trang danh sách đơn.
    Nếu lỗi API: catch và setError(message từ API hoặc message mặc định).
    setSubmitting(false) để tắt loading dù success hay fail.
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSaveSuccess(false);

    try {
      const orderData = {
        ...formData,
        items,
        orderDate: formData.orderDate.toISOString(),
      };

      let response;
      if (editingOrder) {
        response = await updateOrder(editingOrder.id, orderData);
      } else {
        response = await createOrder(orderData);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response.data.order);
        } else {
          navigate("/orders");
        }
      }, 1500);
    } catch (error) {
      console.error("Error saving order:", error);
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi lưu đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
    Hàm searchCustomers: dùng cho AsyncSelect của khách hàng để gợi ý tên khách:
    inputValue: chuỗi user gõ vào ô tìm kiếm.
    Gọi API searchOrders với params { query: inputValue, field: "customerName", limit: 10 }.
      Mục đích: searchOrders trả về danh sách đơn hàng matching customerName, sử dụng tạm để gợi ý tên.
    response.data: giả sử là mảng kết quả, mỗi phần tử chứa customerName, customerPhone, customerEmail, customerAddress.
    map thành object { value, label, phone, email, address } để AsyncSelect hiển thị.
    Nếu lỗi, log ra console và return mảng rỗng.
  */
  const searchCustomers = async (inputValue) => {
    try {
      const response = await searchOrders({
        query: inputValue,
        field: "customerName",
        limit: 10,
      });

      return response.data.map((result) => ({
        value: result.customerName,
        label: result.customerName,
        phone: result.customerPhone,
        email: result.customerEmail,
        address: result.customerAddress,
      }));
    } catch (error) {
      console.error("Error searching customers:", error);
      return [];
    }
  };

  /*
    Hàm handleCustomerSelect: khi user chọn một option từ AsyncSelect tìm kiếm khách hàng:
    selected: object { value, label, phone, email, address } hoặc null nếu clear.
    Tiếp theo, gán các trường tương ứng vào formData:
      – customerName = selected.value
      – customerPhone, customerEmail, customerAddress từ các thuộc tính tương ứng (nếu có), hoặc giữ nguyên nếu null.
  */
  const handleCustomerSelect = (selected) => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        customerName: selected.value,
        customerPhone: selected.phone || prev.customerPhone,
        customerEmail: selected.email || prev.customerEmail,
        customerAddress: selected.address || prev.customerAddress,
      }));
    }
  };

  // ——————————————————————————————————————————————————————————————————————
  // Phần JSX trả về giao diện OrderForm
  // ——————————————————————————————————————————————————————————————————————
  return (
    <div className="order-form">
      <Form onSubmit={handleSubmit}>
        {/* Nếu có error state, hiển thị Alert variant="danger" */}
        {error && <Alert variant="danger">{error}</Alert>}
        {/* Nếu saveSuccess = true, hiển thị Alert variant="success" */}
        {saveSuccess && (
          <Alert variant="success">
            Đơn hàng đã được {editingOrder ? "cập nhật" : "tạo"} thành công!
          </Alert>
        )}

        {/* —————————————————————————————— */}
        {/* Card 1: Thông tin khách hàng */}
        {/* —————————————————————————————— */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Thông tin khách hàng
          </Card.Header>
          <Card.Body>
            <Row>
              {/* Cột Tên khách hàng (AsyncSelect + Input fallback) */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Tên khách hàng <span className="text-danger">*</span>
                  </Form.Label>
                  <AsyncSelect
                    cacheOptions
                    // Lưu cache các kết quả tìm kiếm để tối ưu
                    loadOptions={searchCustomers}
                    // Hàm gọi mỗi khi user gõ để lấy danh sách khách hàng gợi ý
                    defaultOptions
                    // Hiển thị danh sách mặc định trước khi user gõ
                    placeholder="Tìm kiếm hoặc nhập tên khách hàng"
                    onChange={handleCustomerSelect}
                    // Khi user chọn, gọi handleCustomerSelect
                    value={
                      formData.customerName
                        ? {
                            value: formData.customerName,
                            label: formData.customerName,
                          }
                        : null
                    }
                    // Hiển thị giá trị gõ nếu đã có formData.customerName
                    isClearable
                    // Cho phép clear lựa chọn
                    className="mb-2"
                  />
                  <Form.Control
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên khách hàng"
                  />
                  {/* Input fallback: nếu user không dùng AsyncSelect, vẫn có thể gõ trực tiếp */}
                </Form.Group>
              </Col>

              {/* Cột Số điện thoại (text input) */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Số điện thoại <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              {/* Cột Email (input type="email") */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="Nhập email khách hàng"
                  />
                </Form.Group>
              </Col>

              {/* Cột Địa chỉ (textarea) */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ giao hàng"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* —————————————————————————————— */}
        {/* Card 2: Chi tiết đơn hàng */}
        {/* —————————————————————————————— */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Chi tiết đơn hàng
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              {/* Cột Ngày đặt hàng (input type="datetime-local") */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Ngày đặt hàng <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="orderDate"
                    value={formatDateForInput(formData.orderDate)}
                    onChange={handleDateChange}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Cột Trạng thái đơn hàng (select) */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Trạng thái đơn hàng</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="refunded">Đã hoàn tiền</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Cột Trạng thái thanh toán (select) */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Trạng thái thanh toán</Form.Label>
                  <Form.Select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                  >
                    <option value="unpaid">Chưa thanh toán</option>
                    <option value="partially_paid">Thanh toán một phần</option>
                    <option value="paid">Đã thanh toán</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              {/* Cột Phương thức thanh toán (text) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phương thức thanh toán</Form.Label>
                  <Form.Control
                    type="text"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    placeholder="Nhập phương thức thanh toán"
                  />
                </Form.Group>
              </Col>

              {/* Cột Phương thức vận chuyển (text) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phương thức vận chuyển</Form.Label>
                  <Form.Control
                    type="text"
                    name="shippingMethod"
                    value={formData.shippingMethod}
                    onChange={handleChange}
                    placeholder="Nhập phương thức vận chuyển"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              {/* Cột Ghi chú (textarea) */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Nhập ghi chú cho đơn hàng"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* —————————————————————————————— */}
        {/* Card 3: Thêm sản phẩm vào đơn hàng */}
        {/* —————————————————————————————— */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Sản phẩm trong đơn hàng
          </Card.Header>
          <Card.Body>
            <Row className="mb-4 pt-2">
              {/* Cột AsyncSelect tìm kiếm sản phẩm */}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Chọn sản phẩm</Form.Label>
                  <AsyncSelect
                    cacheOptions
                    // Lưu cache kết quả tìm kiếm
                    loadOptions={loadProducts}
                    // Hàm gọi để load danh sách sản phẩm khi user gõ
                    defaultOptions
                    // Hiển thị danh sách mặc định trước khi gõ
                    value={selectedProduct}
                    // Giá trị option đang được chọn
                    onChange={handleProductSelect}
                    // Khi user chọn, gọi hàm handleProductSelect
                    placeholder="Tìm kiếm sản phẩm..."
                    isClearable
                    // Cho phép xóa clear hiện tại
                    noOptionsMessage={() => "Không tìm thấy sản phẩm"}
                  />
                </Form.Group>
              </Col>

              {/* Cột Số lượng (input number) */}
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Số lượng</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Cột Đơn giá (input number) */}
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Đơn giá</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Cột Giảm giá cho item (input number) */}
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Giảm giá</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1000"
                    value={itemDiscount}
                    onChange={(e) => setItemDiscount(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Cột Nút Thêm hoặc Lưu/Hủy khi đang edit item */}
              <Col md={2} className="d-flex align-items-end">
                {editingItemIndex >= 0 ? (
                  // Nếu editingItemIndex >= 0 (đang edit), hiển thị nút Save (FaSave) và Cancel (FaTimes)
                  <div className="d-flex gap-2 w-100">
                    <Button
                      variant="success"
                      onClick={addOrderItem}
                      className="flex-grow-1"
                      title="Lưu"
                    >
                      <FaSave />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={cancelEdit}
                      title="Hủy"
                    >
                      <FaTimes />
                    </Button>
                  </div>
                ) : (
                  // Nếu không edit (thêm mới), hiển thị nút Thêm (FaPlus)
                  <Button
                    variant="primary"
                    onClick={addOrderItem}
                    className="w-100"
                  >
                    <FaPlus className="me-1" /> Thêm
                  </Button>
                )}
              </Col>
            </Row>

            {/* Nếu đã có items, hiển thị bảng, ngược lại hiển thị thông báo */}
            {items.length > 0 ? (
              <div className="table-responsive">
                <Table bordered hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "5%" }}>STT</th>
                      <th style={{ width: "30%" }}>Sản phẩm</th>
                      <th style={{ width: "15%" }}>Mã sản phẩm</th>
                      <th style={{ width: "10%" }}>Đơn giá</th>
                      <th style={{ width: "10%" }}>Số lượng</th>
                      <th style={{ width: "10%" }}>Giảm giá</th>
                      <th style={{ width: "10%" }}>Thành tiền</th>
                      <th style={{ width: "10%" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.productName}</td>
                        <td>{item.productCode}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.discount)}</td>
                        <td>{formatCurrency(item.total)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            {/* Nút Chỉnh sửa item (FaEdit) */}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Chỉnh sửa"
                              onClick={() => editItem(index)}
                            >
                              <FaEdit />
                            </Button>
                            {/* Nút Xóa item (FaTrash) */}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Xóa"
                              onClick={() => removeItem(index)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Alert variant="info">
                Chưa có sản phẩm nào trong đơn hàng. Vui lòng thêm sản phẩm.
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* —————————————————————————————— */}
        {/* Card 4: Tổng hợp và thanh toán */}
        {/* —————————————————————————————— */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Tổng hợp và thanh toán
          </Card.Header>
          <Card.Body>
            <Row>
              {/* Cột hiển thị subtotal, discount, tax, grand total */}
              <Col md={6}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tổng tiền hàng:</span>
                  <strong>{formatCurrency(calcSubTotal())}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Giảm giá:</span>
                  <strong>{formatCurrency(formData.discount || 0)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Thuế:</span>
                  <strong>{formatCurrency(formData.tax || 0)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="h5">Tổng thanh toán:</span>
                  <span className="h5 text-primary">
                    {formatCurrency(calcGrandTotal())}
                  </span>
                </div>
              </Col>

              {/* Cột input điều chỉnh discount và tax */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giảm giá (cho toàn đơn hàng)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1000"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Thuế</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1000"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Nút Hủy (navigates to /orders) và Nút Lưu/Cập nhật */}
        <div className="d-flex justify-content-end mt-4 mb-5">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate("/orders")}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="d-flex align-items-center"
          >
            {/* Nếu đang submitting, hiển thị Spinner */}
            {submitting && (
              <Spinner animation="border" size="sm" className="me-2" />
            )}
            {editingOrder ? "Cập nhật đơn hàng" : "Tạo đơn hàng"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default OrderForm;
