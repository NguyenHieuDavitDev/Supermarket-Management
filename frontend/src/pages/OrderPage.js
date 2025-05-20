import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Tab, Tabs } from "react-bootstrap";
import { FaPlus, FaList } from "react-icons/fa";
import OrderList from "../components/OrderList";
import OrderForm from "../components/OrderForm";
import { getOrderById } from "../services/api";

const OrderPage = () => {
  const [mode, setMode] = useState("list"); // list, create, edit
  const [activeTab, setActiveTab] = useState("active");
  const [editingOrder, setEditingOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle creating a new order
  const handleCreateOrder = () => {
    setEditingOrder(null);
    setMode("create");
  };

  // Handle editing an existing order
  const handleEditOrder = async (id) => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrderById(id);
      setEditingOrder(response.data);
      setMode("edit");
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle order save success
  const handleOrderSaveSuccess = () => {
    setMode("list");
    setRefreshKey((prev) => prev + 1);
  };

  // Handle returning to list view
  const handleReturnToList = () => {
    setMode("list");
    setEditingOrder(null);
  };

  // Render content based on mode
  const renderContent = () => {
    if (mode === "list") {
      return (
        <div className="order-page">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Quản lý đơn hàng</h2>
            <Button variant="primary" onClick={handleCreateOrder}>
              <FaPlus className="me-2" /> Tạo đơn hàng mới
            </Button>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="active" title="Đơn hàng đang hoạt động">
              <OrderList
                key={`active-${refreshKey}`}
                filterDeleted={false}
                onEditOrder={handleEditOrder}
                filterStatus={["pending", "processing"]}
              />
            </Tab>
            <Tab eventKey="completed" title="Đơn hàng đã hoàn thành">
              <OrderList
                key={`completed-${refreshKey}`}
                filterDeleted={false}
                onEditOrder={handleEditOrder}
                filterStatus={["completed"]}
              />
            </Tab>
            <Tab eventKey="cancelled" title="Đơn hàng đã hủy">
              <OrderList
                key={`cancelled-${refreshKey}`}
                filterDeleted={false}
                onEditOrder={handleEditOrder}
                filterStatus={["cancelled", "refunded"]}
              />
            </Tab>
            <Tab eventKey="deleted" title="Đã xóa">
              <OrderList
                key={`deleted-${refreshKey}`}
                filterDeleted={true}
                onEditOrder={handleEditOrder}
              />
            </Tab>
            <Tab eventKey="all" title="Tất cả đơn hàng">
              <OrderList
                key={`all-${refreshKey}`}
                onEditOrder={handleEditOrder}
              />
            </Tab>
          </Tabs>
        </div>
      );
    } else if (mode === "create" || mode === "edit") {
      return (
        <div className="order-form-container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              {mode === "create" ? "Tạo đơn hàng mới" : "Chỉnh sửa đơn hàng"}
            </h2>
            <Button variant="outline-secondary" onClick={handleReturnToList}>
              <FaList className="me-2" /> Quay lại danh sách
            </Button>
          </div>

          <OrderForm
            editingOrder={editingOrder}
            onSuccess={handleOrderSaveSuccess}
          />
        </div>
      );
    }
  };

  return (
    <Container fluid className="p-4">
      {renderContent()}
    </Container>
  );
};

export default OrderPage;
