import React, { useState } from "react";
// import React: thư viện chính để xây dựng component React.
// useState: React Hook để khai báo và quản lý state bên trong functional component.

import { Container, Card, Modal, Button } from "react-bootstrap";
// Container: thành phần khung chứa chính, tự động thêm padding và căn giữa nội dung theo chuẩn Bootstrap.
// Card: thành phần “thẻ” (card) để đóng khung nội dung, có shadow và border-radius mặc định.
// Modal: thành phần hiển thị hộp thoại (popup) bên trên nội dung chính, có backdrop mờ phía sau.
// Button: thành phần nút bấm, đã được style sẵn theo Bootstrap.

import SupplierList from "../components/SupplierList";
// SupplierList: component tự tạo (nằm trong thư mục components) để hiển thị danh sách nhà cung cấp.
//   Khi render, SupplierList sẽ lấy dữ liệu từ API, hiển thị bảng, xử lý tìm kiếm, phân trang, v.v.

import SupplierForm from "../components/SupplierForm";
// SupplierForm: component tự tạo (nằm trong thư mục components) để hiển thị form thêm hoặc chỉnh sửa nhà cung cấp.
//   SupplierForm nhận vào prop editingSupplier (object nếu đang sửa, hoặc null nếu thêm mới)
//   và onSuccess (callback khi lưu thành công).

import { FaPlus } from "react-icons/fa";
// FaPlus: biểu tượng “dấu cộng” (plus) từ thư viện react-icons (Font Awesome).

// Định nghĩa functional component chính: trang quản lý nhà cung cấp (SupplierPage)
const SupplierPage = () => {
  // Khai báo state showModal (kiểm soát hiển thị modal):
  // showModal: boolean, true => modal hiển thị, false => modal ẩn.
  const [showModal, setShowModal] = useState(false);
  // useState(false): khởi tạo state showModal = false (modal ẩn).
  // setShowModal: hàm để thay đổi giá trị showModal.

  // Khai báo state editingSupplier (lưu nhà cung cấp đang được chỉnh sửa):
  // editingSupplier: nếu null => không có supplier nào đang sửa (form sẽ ở chế độ “thêm mới”).
  //                     nếu là object supplier => form sẽ load dữ liệu để chỉnh sửa.
  const [editingSupplier, setEditingSupplier] = useState(null);
  // useState(null): khởi tạo editingSupplier = null.
  // setEditingSupplier: hàm để gán hoặc reset (null) đối tượng supplier.

  // Khai báo state refreshKey (dùng để buộc SupplierList reload khi thay đổi):
  // refreshKey: giá trị số, mỗi lần tăng lên 1 sẽ tạo prop key mới cho SupplierList,
  //              khiến React remount lại SupplierList, từ đó component sẽ fetch lại dữ liệu.
  const [refreshKey, setRefreshKey] = useState(0);

  //
  // Hàm handleCloseModal: đóng modal và reset editingSupplier
  //
  const handleCloseModal = () => {
    setShowModal(false);
    // Đặt showModal = false để ẩn Modal.
    setEditingSupplier(null);
    // Đặt editingSupplier = null để xóa dữ liệu cũ (nếu có) khỏi form.
  };

  //
  // Hàm handleAddNew: khi user bấm nút “Thêm nhà cung cấp”
  //
  const handleAddNew = () => {
    setEditingSupplier(null);
    // Đảm bảo editingSupplier = null => form sẽ ở chế độ “thêm mới”.
    setShowModal(true);
    // Hiển thị modal (Modal sẽ bật lên).
  };

  //
  // Hàm handleEdit: khi user bấm nút “Sửa” một supplier trong danh sách,
  //   tham số supplier là object chứa dữ liệu của supplier đó (id, name, email, v.v.).
  //
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    // Lưu object supplier vào editingSupplier, để form load sẵn dữ liệu.
    setShowModal(true);
    // Hiển thị modal để người dùng chỉnh sửa.
  };

  //
  // Hàm handleSuccess: khi form lưu thành công (tạo mới hoặc cập nhật),
  //   sẽ được SupplierForm gọi thông qua prop onSuccess.
  //
  const handleSuccess = () => {
    handleCloseModal();
    // Đóng modal và reset editingSupplier.
    setRefreshKey((prevKey) => prevKey + 1);
    // Tăng refreshKey lên 1 => buộc SupplierList reload danh sách mới.
  };

  // Phần JSX trả về giao diện trang quản lý nhà cung cấp
  return (
    // <Container fluid className="my-4">:
    // Container: khung chứa chính; “fluid” nghĩa là chiều rộng full (100%).
    // className="my-4": margin-top và margin-bottom = 1.5rem (Bootstrap spacing).
    <Container fluid className="my-4">
      {/* 
        Thanh tiêu đề và nút “Thêm nhà cung cấp”:
        className="d-flex justify-content-between align-items-center mb-4":
          – d-flex: bật flexbox cho div.
          – justify-content-between: phân bố hai phần tử (title và nút) hai đầu.
          – align-items-center: căn giữa theo chiều dọc.
          – mb-4: margin-bottom = 1.5rem.
      */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* 
          <h1 className="mb-0">: 
          h1: thẻ tiêu đề lớn (Heading 1).
          className="mb-0": margin-bottom = 0, bỏ khoảng trống dưới.
        */}
        <h1 className="mb-0">Quản lý nhà cung cấp</h1>

        {/* 
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={handleAddNew}
          >
          variant="primary": style nút (màu nền chính).
          className="d-flex align-items-center gap-2":
            – d-flex: bật flexbox cho Button (cho icon và text nằm ngang).
            – align-items-center: căn giữa icon và text theo chiều dọc.
            – gap-2: khoảng cách giữa icon và text = 0.5rem.
          onClick={handleAddNew}: khi click gọi hàm handleAddNew, mở modal để thêm mới.
        */}
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={handleAddNew}
        >
          {/* <FaPlus />: icon “dấu cộng” */}
          <FaPlus /> Thêm nhà cung cấp
        </Button>
      </div>

      {/* 
        Card chứa SupplierList:
        Card: thẻ có shadow và border-radius, dùng để nhóm nội dung.
      */}
      <Card>
        <Card.Body>
          {/* 
            <SupplierList key={refreshKey} onEdit={handleEdit} />:
            SupplierList: component tự tạo hiển thị bảng danh sách nhà cung cấp.
            key={refreshKey}: key prop dùng để buộc React remount SupplierList mỗi khi refreshKey thay đổi.
            onEdit={handleEdit}: truyền hàm handleEdit xuống SupplierList, để khi user bấm “Sửa” trên hàng nào,
              SupplierList sẽ gọi onEdit(supplier) và ta sẽ mở modal với dữ liệu cần chỉnh sửa.
          */}
          <SupplierList key={refreshKey} onEdit={handleEdit} />
        </Card.Body>
      </Card>

      {/* 
        Modal hiển thị form thêm/chỉnh sửa nhà cung cấp:
        show={showModal}: điều khiển hiển thị modal (true => hiện, false => ẩn).
        onHide={handleCloseModal}: khi click vào backdrop hoặc nút “X”, gọi handleCloseModal để đóng modal.
        backdrop="static": không đóng modal khi click bên ngoài vùng modal (click backdrop không đóng).
        keyboard={false}: không đóng modal khi nhấn phím Esc.
        size="lg": kích thước modal large (rộng).
      */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        {/* Modal.Header chứa tiêu đề và nút đóng */}
        <Modal.Header closeButton>
          <Modal.Title>
            {/* 
              Nếu editingSupplier != null, hiển thị “Cập nhật nhà cung cấp”,
              nếu null (tức thêm mới), hiển thị “Thêm nhà cung cấp mới”.
            */}
            {editingSupplier
              ? "Cập nhật nhà cung cấp"
              : "Thêm nhà cung cấp mới"}
          </Modal.Title>
        </Modal.Header>

        {/* Modal.Body chứa component SupplierForm */}
        <Modal.Body>
          {/* 
            <SupplierForm
              editingSupplier={editingSupplier}
              onSuccess={handleSuccess}
            />
            editingSupplier={editingSupplier}: truyền object nhà cung cấp đang sửa (hoặc null nếu thêm mới).
            onSuccess={handleSuccess}: callback khi SupplierForm lưu thành công, để đóng modal và refresh danh sách.
          */}
          <SupplierForm
            editingSupplier={editingSupplier}
            onSuccess={handleSuccess}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// Xuất default component SupplierPage
export default SupplierPage;
