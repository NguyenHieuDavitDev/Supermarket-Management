import React, { useState } from "react";
// import React: thư viện chính để xây dựng component React.
// useState: React Hook để khai báo state trong functional component.

import { Container, Card, Modal, Button } from "react-bootstrap";
// Container, Card, Modal, Button: các component UI có sẵn từ thư viện React‑Bootstrap.
//   – Container: khung chứa chính, giúp căn chỉnh lề và padding theo chuẩn Bootstrap.
//   – Card: thành phần giao diện dạng “thẻ” (card) với header/body/footer, dùng để đóng khung nội dung.
//   – Modal: thành phần hiển thị hộp thoại (popup) bên trên nội dung chính.
//   – Button: thành phần nút bấm, đã được style sẵn theo Bootstrap.

import ProductList from "../components/ProductList";
// ProductList: component tự tạo (dưới thư mục components) để hiển thị danh sách sản phẩm.

import ProductForm from "../components/ProductForm";
// ProductForm: component tự tạo (dưới thư mục components) để hiển thị form thêm hoặc chỉnh sửa sản phẩm.

import { FaPlus } from "react-icons/fa";
// FaPlus: icon “dấu cộng” (plus) từ thư viện react-icons (FontAwesome).

// Định nghĩa functional component ProductPage (trang quản lý sản phẩm)
const ProductPage = () => {
  // Khai báo state showModal (kiểm soát xem modal (hộp thoại) có hiện hay không)
  const [showModal, setShowModal] = useState(false);
  // useState(false): khởi tạo showModal = false (modal ẩn).
  // setShowModal: hàm thay đổi giá trị showModal.

  // Khai báo state editingProduct (lưu đối tượng sản phẩm đang được chỉnh sửa hoặc null nếu tạo mới)
  const [editingProduct, setEditingProduct] = useState(null);
  // editingProduct = null ban đầu (không có sản phẩm nào đang sửa).
  // setEditingProduct: hàm ghi đè state editingProduct.

  // Khai báo state refreshKey (dùng để buộc ProductList reload khi thay đổi giá trị)
  const [refreshKey, setRefreshKey] = useState(0);
  // Mỗi lần setRefreshKey(prevKey => prevKey + 1), key prop của ProductList thay đổi,
  //   React sẽ remount ProductList, từ đó component sẽ fetch lại dữ liệu mới.

  //
  // Hàm handleCloseModal: đóng modal và reset editingProduct về null
  //
  const handleCloseModal = () => {
    setShowModal(false);
    // Ẩn modal (Modal sẽ không hiển thị)
    setEditingProduct(null);
    // Xóa sản phẩm đang sửa (nếu có), để form reset về tạo mới khi mở lại
  };

  //
  // Hàm handleAddNew: khi user bấm nút “Thêm sản phẩm mới”
  //
  const handleAddNew = () => {
    setEditingProduct(null);
    // Đảm bảo không có sản phẩm nào trong editingProduct, tức form sẽ ở chế độ “create” (thêm mới).
    setShowModal(true);
    // Hiện modal để user nhập thông tin sản phẩm mới.
  };

  //
  // Hàm handleEdit: khi user bấm nút “Sửa” trên một sản phẩm cụ thể,
  //   product là object chứa dữ liệu sản phẩm cần chỉnh sửa
  //
  const handleEdit = (product) => {
    setEditingProduct(product);
    // Ghi object product vào state editingProduct, để ProductForm nhận biết
    //   và load sẵn dữ liệu của product trong form (chế độ “edit”).
    setShowModal(true);
    // Hiện modal để user chỉnh sửa.
  };

  //
  // Hàm handleSuccess: khi ProductForm lưu thành công (tạo mới hoặc cập nhật),
  //   callback này sẽ được ProductForm gọi (prop onSuccess)
  //
  const handleSuccess = () => {
    handleCloseModal();
    // Đóng modal và reset editingProduct
    setRefreshKey((prevKey) => prevKey + 1);
    // Tăng refreshKey lên 1 để buộc ProductList reload (key prop thay đổi).
  };

  // Phần JSX trả về giao diện trang quản lý sản phẩm
  return (
    // <Container fluid className="my-4">:
    // Container: thành phần khung chứa, “fluid” nghĩa là chiều rộng rộng 100% (full-width).
    // className="my-4": margin dọc (y-axis) = 1.5rem (Bootstrap spacing).
    <Container fluid className="my-4">
      {/* 
        Thanh tiêu đề và nút “Thêm sản phẩm mới”
        d-flex: bật flexbox
        justify-content-between: căn hai đầu (title trái, nút phải)
        align-items-center: căn giữa theo chiều dọc
        mb-4: margin-bottom = 1.5rem
      */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* 
          <h1 className="mb-0">: 
          h1: thẻ tiêu đề lớn (Heading 1)
          className="mb-0": margin-bottom = 0 (xoá khoảng cách dưới)
        */}
        <h1 className="mb-0">Quản lý sản phẩm</h1>

        {/* 
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleAddNew}>
          variant="primary": style nút (nền màu chính mặc định của Bootstrap).
          className="d-flex align-items-center gap-2": 
            - d-flex: bật flex trên Button (icon và text nằm cạnh nhau theo flex).
            - align-items-center: căn giữa theo chiều dọc icon + text.
            - gap-2: khoảng cách giữa các phần tử con (icon và text) là 0.5rem.
          onClick={handleAddNew}: gọi hàm handleAddNew khi user bấm nút.
        */}
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={handleAddNew}
        >
          {/* <FaPlus />: icon dấu cộng */}
          <FaPlus /> Thêm sản phẩm mới
        </Button>
      </div>

      {/* 
        Card chứa ProductList 
        Card: khung hiển thị có shadow & border-radius mặc định của Bootstrap Card.
      */}
      <Card>
        <Card.Body>
          {/* 
            <ProductList key={refreshKey} onEdit={handleEdit} />:
            ProductList: component hiển thị danh sách sản phẩm.
            key={refreshKey}: key prop dùng để yêu cầu React remount component mỗi khi refreshKey thay đổi.
            onEdit={handleEdit}: truyền callback handleEdit xuống ProductList, để khi user bấm nút Sửa ở ProductList,
              ProductList sẽ gọi onEdit(product) và ta có thể mở modal điền form.
          */}
          <ProductList key={refreshKey} onEdit={handleEdit} />
        </Card.Body>
      </Card>

      {/* 
        Modal hiển thị form thêm hoặc chỉnh sửa sản phẩm:
        show={showModal}: điều khiển hiển thị hoặc ẩn Modal.
        onHide={handleCloseModal}: khi nhấn overlay hoặc nút “X”, gọi handleCloseModal để đóng.
        backdrop="static": không đóng modal khi click ngoài vùng modal (click backdrop sẽ không tự đóng).
        keyboard={false}: không đóng modal khi nhấn Esc.
        size="lg": kích thước lớn (large) cho modal.
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
              Nếu editingProduct tồn tại (không null), đổi tiêu đề thành “Cập nhật sản phẩm”,
              ngược lại hiển thị “Thêm sản phẩm mới”.
            */}
            {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </Modal.Title>
        </Modal.Header>

        {/* Modal.Body chứa component ProductForm */}
        <Modal.Body>
          {/* 
            <ProductForm
              editingProduct={editingProduct}
              onSuccess={handleSuccess}
            />
            editingProduct={editingProduct}: truyền object sản phẩm đang sửa (hoặc null nếu tạo mới).
            onSuccess={handleSuccess}: callback được gọi khi ProductForm lưu thành công.
          */}
          <ProductForm
            editingProduct={editingProduct}
            onSuccess={handleSuccess}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// Xuất default component ProductPage để có thể import ở nơi khác
export default ProductPage;
