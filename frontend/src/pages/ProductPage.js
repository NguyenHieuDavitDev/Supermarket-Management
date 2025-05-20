import React, { useState } from "react";
import { Container, Card, Modal, Button } from "react-bootstrap";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import { FaPlus } from "react-icons/fa";

const ProductPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // Handle add new product
  const handleAddNew = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  // Handle edit product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  // Handle success submit
  const handleSuccess = () => {
    handleCloseModal();
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <Container fluid className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Quản lý sản phẩm</h1>
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={handleAddNew}
        >
          <FaPlus /> Thêm sản phẩm mới
        </Button>
      </div>

      <Card>
        <Card.Body>
          <ProductList key={refreshKey} onEdit={handleEdit} />
        </Card.Body>
      </Card>

      {/* Modal for adding/editing product */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProductForm
            editingProduct={editingProduct}
            onSuccess={handleSuccess}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProductPage;
