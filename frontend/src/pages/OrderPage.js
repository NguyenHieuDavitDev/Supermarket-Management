import React, { useState, useEffect } from "react";
// - import React: thư viện chính để xây dựng component React.
// - useState, useEffect: hai React Hook để quản lý state và side-effect.

import { Container, Row, Col, Button, Tab, Tabs } from "react-bootstrap";
// - Container, Row, Col, Button, Tab, Tabs: các component UI do thư viện React‑Bootstrap cung cấp.
//   Container: khung chứa chính, thường dùng để tạo lưới (layout) có padding mặc định.
//   Row, Col: hệ thống lưới (grid) giúp chia cột, dòng theo Bootstrap.
//   Button: component nút bấm (đã tích hợp style của Bootstrap).
//   Tab, Tabs: component để tạo giao diện tab (thẻ chọn) theo style Bootstrap.

import { FaPlus, FaList } from "react-icons/fa";
// - FaPlus, FaList: hai icon (Font Awesome) từ thư viện react-icons.fa.
//   FaPlus: biểu tượng dấu cộng (“+”).
//   FaList: biểu tượng danh sách (list).

import OrderList from "../components/OrderList";
// - OrderList: component tự tạo nằm trong thư mục components, chịu trách nhiệm hiển thị danh sách đơn hàng.

import OrderForm from "../components/OrderForm";
// - OrderForm: component tự tạo nằm trong thư mục components, chịu trách nhiệm hiển thị form tạo hoặc chỉnh sửa đơn hàng.

import { getOrderById } from "../services/api";
// - getOrderById: hàm API tự tạo, gọi đến backend để lấy chi tiết một đơn hàng theo ID.

// Định nghĩa component OrderPage (chức năng quản lý đơn hàng)
const OrderPage = () => {
  // Khai báo state mode (quản lý chế độ hiển thị): “list” (xem danh sách), “create” (tạo mới), “edit” (chỉnh sửa).
  const [mode, setMode] = useState("list");
  // useState("list") khởi tạo biến mode = "list" (giá trị mặc định).
  // setMode: hàm thay đổi state mode.

  // State activeTab (tab đang active, gồm “active”, “completed”, “cancelled”, “deleted”, “all”).
  const [activeTab, setActiveTab] = useState("active");
  // Các eventKey khi sử dụng component <Tabs activeKey=...> sẽ khớp với activeTab.

  // State editingOrder (biến lưu đơn hàng đang được chỉnh sửa, hoặc null nếu không có).
  const [editingOrder, setEditingOrder] = useState(null);
  // Khi user bấm “Sửa” một đơn, setEditingOrder sẽ chứa object dữ liệu đơn đó.

  // State refreshKey (dùng để kích hoạt reload OrderList bằng cách thay đổi key prop).
  const [refreshKey, setRefreshKey] = useState(0);
  // Mỗi lần setRefreshKey(prev => prev + 1), giá trị key cho OrderList sẽ thay đổi,
  //   buộc React unmount và remount OrderList, từ đó OrderList sẽ fetch lại dữ liệu.

  // State loading: báo hiệu đang thực hiện gọi API (fetch order details) khi bấm “Sửa”.
  const [loading, setLoading] = useState(false);

  // State error: lưu thông báo lỗi nếu gọi API getOrderById thất bại.
  const [error, setError] = useState("");

  //
  // Hàm handleCreateOrder: khi user bấm nút “Tạo đơn hàng mới”
  //
  const handleCreateOrder = () => {
    setEditingOrder(null);
    // Đảm bảo editingOrder = null (không load sẵn một đơn để sửa).
    setMode("create");
    // Chuyển mode sang “create” để hiển thị OrderForm dựng form tạo mới.
  };

  //
  // Hàm handleEditOrder: khi user bấm nút “Sửa” một đơn hàng,
  //   cần fetch chi tiết đơn theo ID từ API và đổi mode thành “edit”.
  //
  const handleEditOrder = async (id) => {
    try {
      setLoading(true); // Bật loading indicator
      setError(""); // Xóa thông báo lỗi cũ (nếu có)

      const response = await getOrderById(id);
      // Gọi API lấy chi tiết đơn với id,
      //   response.data trả về object chứa thông tin đơn hàng.

      setEditingOrder(response.data);
      // Lưu object đơn hàng vào editingOrder để hiển thị trong form.
      setMode("edit");
      // Chuyển chế độ sang “edit” để render OrderForm với dữ liệu có sẵn.
    } catch (error) {
      console.error("Error fetching order details:", error);
      // Nếu có lỗi khi gọi API, in ra console
      setError("Failed to load order details. Please try again.");
      // Lưu thông báo lỗi vào state error để hiển thị (nếu muốn show).
    } finally {
      setLoading(false);
      // Dù thành công hay thất bại, tắt loading indicator.
    }
  };

  //
  // Hàm handleOrderSaveSuccess: được gọi khi OrderForm tạo hoặc cập nhật thành công
  //
  const handleOrderSaveSuccess = () => {
    setMode("list");
    // Sau khi lưu thành công, quay về chế độ “list” (danh sách).
    setRefreshKey((prev) => prev + 1);
    // Tăng refreshKey để reload lại danh sách trong các tab OrderList.
  };

  //
  // Hàm handleReturnToList: khi user bấm “Quay lại danh sách”
  //
  const handleReturnToList = () => {
    setMode("list"); // Chuyển về chế độ “list”
    setEditingOrder(null); // Xóa editingOrder để không giữ dữ liệu cũ
  };

  //
  // Hàm renderContent: tuỳ vào mode hiện tại, render giao diện tương ứng
  //
  const renderContent = () => {
    if (mode === "list") {
      // Nếu mode = "list", hiển thị giao diện xem danh sách đơn hàng
      return (
        <div className="order-page">
          {/* 
            Dòng header chứa tiêu đề và nút tạo đơn mới
            className="d-flex justify-content-between align-items-center mb-4":
              - d-flex: display: flex
              - justify-content-between: căn hai đầu
              - align-items-center: căn giữa theo chiều dọc
              - mb-4: margin-bottom = 1.5rem (Bootstrap spacing)
          */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Quản lý đơn hàng</h2>
            {/* 
              Nút tạo đơn mới 
              variant="primary": màu nền nút
              onClick={handleCreateOrder}: khi bấm gọi hàm chuyển mode sang “create”
            */}
            <Button variant="primary" onClick={handleCreateOrder}>
              {/* 
                <FaPlus className="me-2" />: icon dấu cộng và margin-right = 0.5rem (me-2)
                “Tạo đơn hàng mới”: text trên nút
              */}
              <FaPlus className="me-2" /> Tạo đơn hàng mới
            </Button>
          </div>

          {/* 
            Component Tabs (tab container) 
            activeKey={activeTab}: xác định tab đang chọn (active)
            onSelect={(k) => setActiveTab(k)}: khi user chọn tab mới (k = eventKey), setActiveTab(k)
            className="mb-4": margin-bottom = 1.5rem
          */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            {/* 
              Tab đầu tiên: Đơn hàng đang hoạt động 
              eventKey="active": giá trị key khi chọn tab này
              title="Đơn hàng đang hoạt động": tiêu đề hiển thị trên tab
            */}
            <Tab eventKey="active" title="Đơn hàng đang hoạt động">
              {/* 
                OrderList component (hiển thị danh sách đơn). Truyền các prop:
                key={`active-${refreshKey}`}: mỗi khi refreshKey thay đổi, key khác => remount => refetch.
                filterDeleted={false}: không lọc đơn bị xóa (chỉ hiển thị đơn không bị xóa).
                onEditOrder={handleEditOrder}: callback khi bấm nút sửa trong OrderList.
                filterStatus={["pending", "processing"]}: chỉ hiển thị đơn có status "pending" hoặc "processing".
              */}
              <OrderList
                key={`active-${refreshKey}`}
                filterDeleted={false}
                onEditOrder={handleEditOrder}
                filterStatus={["pending", "processing"]}
              />
            </Tab>

            {/* Tab 2: Đơn hàng đã hoàn thành */}
            <Tab eventKey="completed" title="Đơn hàng đã hoàn thành">
              <OrderList
                key={`completed-${refreshKey}`}
                filterDeleted={false}
                onEditOrder={handleEditOrder}
                filterStatus={["completed"]}
              />
            </Tab>

            {/* Tab 3: Đơn hàng đã hủy */}
            <Tab eventKey="cancelled" title="Đơn hàng đã hủy">
              <OrderList
                key={`cancelled-${refreshKey}`}
                filterDeleted={false}
                onEditOrder={handleEditOrder}
                filterStatus={["cancelled", "refunded"]}
              />
            </Tab>

            {/* Tab 4: Đã xóa (filterDeleted = true) */}
            <Tab eventKey="deleted" title="Đã xóa">
              <OrderList
                key={`deleted-${refreshKey}`}
                filterDeleted={true}
                onEditOrder={handleEditOrder}
              />
            </Tab>

            {/* Tab 5: Tất cả đơn hàng */}
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
      // Nếu mode = "create" (tạo đơn mới) hoặc mode = "edit" (chỉnh sửa)
      return (
        <div className="order-form-container">
          {/* 
            Header cho form tạo, chỉnh sửa:
            d-flex justify-content-between align-items-center mb-4: căn flex tương tự trên.
            Hiển thị tiêu đề tuỳ thuộc mode: 
              - nếu mode === "create": "Tạo đơn hàng mới"
              - nếu mode === "edit": "Chỉnh sửa đơn hàng"
          */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              {mode === "create" ? "Tạo đơn hàng mới" : "Chỉnh sửa đơn hàng"}
            </h2>
            {/* 
              Nút “Quay lại danh sách”:
              variant="outline-secondary": style nút viền (outline) màu secondary
              onClick={handleReturnToList}: khi bấm sẽ gọi hàm setMode("list"), setEditingOrder(null)
            */}
            <Button variant="outline-secondary" onClick={handleReturnToList}>
              <FaList className="me-2" /> Quay lại danh sách
            </Button>
          </div>

          {/* 
            Component OrderForm (form tạo/sửa đơn hàng):
            editingOrder={editingOrder}: nếu chỉnh sửa, truyền vào object đơn đang sửa để OrderForm load sẵn dữ liệu.
            onSuccess={handleOrderSaveSuccess}: callback khi OrderForm lưu thành công (tạo hoặc cập nhật), quay về “list” và refreshKey++.
          */}
          <OrderForm
            editingOrder={editingOrder}
            onSuccess={handleOrderSaveSuccess}
          />
        </div>
      );
    }
  };

  // Render ra giao diện chính của OrderPage
  return (
    // Container fluid: container full-width không giới hạn breakpoint, className="p-4": padding = 1.5rem
    <Container fluid className="p-4">
      {renderContent()}
      {/* Gọi hàm renderContent() để chèn nội dung tương ứng vớ i mode */}
    </Container>
  );
};

// Xuất default component OrderPage để sử dụng ở nơi khác
export default OrderPage;
