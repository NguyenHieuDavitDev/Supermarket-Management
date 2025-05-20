import React, { useState, useEffect, useCallback } from "react";
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
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import {
  createOrder,
  updateOrder,
  getProducts,
  searchOrders,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import AsyncSelect from "react-select/async";

const OrderForm = ({ editingOrder, onSuccess }) => {
  const navigate = useNavigate();

  // Basic form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    orderDate: new Date(),
    notes: "",
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "",
    shippingMethod: "",
    discount: 0,
    tax: 0,
  });

  // Order items state
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemNotes, setItemNotes] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState(-1);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate totals
  const calcSubTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calcGrandTotal = () => {
    return (
      calcSubTotal() -
      (parseFloat(formData.discount) || 0) +
      (parseFloat(formData.tax) || 0)
    );
  };

  // Load existing order data when editing
  useEffect(() => {
    if (editingOrder) {
      // Set basic order data
      setFormData({
        customerName: editingOrder.customerName || "",
        customerPhone: editingOrder.customerPhone || "",
        customerEmail: editingOrder.customerEmail || "",
        customerAddress: editingOrder.customerAddress || "",
        orderDate: editingOrder.orderDate
          ? new Date(editingOrder.orderDate)
          : new Date(),
        notes: editingOrder.notes || "",
        status: editingOrder.status || "pending",
        paymentStatus: editingOrder.paymentStatus || "unpaid",
        paymentMethod: editingOrder.paymentMethod || "",
        shippingMethod: editingOrder.shippingMethod || "",
        discount: editingOrder.discount || 0,
        tax: editingOrder.tax || 0,
      });

      // Set order items
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date change
  const handleDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      orderDate: new Date(e.target.value),
    }));
  };

  // Format date to YYYY-MM-DDTHH:MM
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Load products for search/selection
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

  // Add new item to order
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

    // Calculate total for this item
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
      // Update existing item
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = newItem;
      setItems(updatedItems);
      setEditingItemIndex(-1);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setPrice(0);
    setItemDiscount(0);
    setItemNotes("");
    setError("");
  };

  // Edit an existing item
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

  // Remove an item from the order
  const removeItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  // Cancel editing an item
  const cancelEdit = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setPrice(0);
    setItemDiscount(0);
    setItemNotes("");
    setEditingItemIndex(-1);
  };

  // Handle product selection
  const handleProductSelect = (selected) => {
    setSelectedProduct(selected);
    if (selected) {
      setPrice(selected.price || 0);
    } else {
      setPrice(0);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Validate the form before submission
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

  // Handle form submission
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

  // Search for customers for autocomplete
  const searchCustomers = async (inputValue) => {
    try {
      // This is a placeholder - you may need to implement a customer search API
      // For now, we'll just search orders to get customer names
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

  // Handle customer selection
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

  return (
    <div className="order-form">
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        {saveSuccess && (
          <Alert variant="success">
            Đơn hàng đã được {editingOrder ? "cập nhật" : "tạo"} thành công!
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Thông tin khách hàng
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Tên khách hàng <span className="text-danger">*</span>
                  </Form.Label>
                  <AsyncSelect
                    cacheOptions
                    loadOptions={searchCustomers}
                    defaultOptions
                    placeholder="Tìm kiếm hoặc nhập tên khách hàng"
                    onChange={handleCustomerSelect}
                    value={
                      formData.customerName
                        ? {
                            value: formData.customerName,
                            label: formData.customerName,
                          }
                        : null
                    }
                    isClearable
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
                </Form.Group>
              </Col>
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

        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Chi tiết đơn hàng
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
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

        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Sản phẩm trong đơn hàng
          </Card.Header>
          <Card.Body>
            <Row className="mb-4 pt-2">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Chọn sản phẩm</Form.Label>
                  <AsyncSelect
                    cacheOptions
                    loadOptions={loadProducts}
                    defaultOptions
                    value={selectedProduct}
                    onChange={handleProductSelect}
                    placeholder="Tìm kiếm sản phẩm..."
                    isClearable
                    noOptionsMessage={() => "Không tìm thấy sản phẩm"}
                  />
                </Form.Group>
              </Col>
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
              <Col md={2} className="d-flex align-items-end">
                {editingItemIndex >= 0 ? (
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
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Chỉnh sửa"
                              onClick={() => editItem(index)}
                            >
                              <FaEdit />
                            </Button>
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

        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            Tổng hợp và thanh toán
          </Card.Header>
          <Card.Body>
            <Row>
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
