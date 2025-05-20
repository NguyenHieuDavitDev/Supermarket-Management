import React, { useState } from "react";
import { Container, Card, Modal, Button } from "react-bootstrap";
import SupplierList from "../components/SupplierList";
import SupplierForm from "../components/SupplierForm";
import { FaPlus } from "react-icons/fa";

const SupplierPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  // Handle add new supplier
  const handleAddNew = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  // Handle edit supplier
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
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
        <h1 className="mb-0">Quản lý nhà cung cấp</h1>
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={handleAddNew}
        >
          <FaPlus /> Thêm nhà cung cấp
        </Button>
      </div>

      <Card>
        <Card.Body>
          <SupplierList key={refreshKey} onEdit={handleEdit} />
        </Card.Body>
      </Card>

      {/* Modal for adding/editing supplier */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSupplier
              ? "Cập nhật nhà cung cấp"
              : "Thêm nhà cung cấp mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SupplierForm
            editingSupplier={editingSupplier}
            onSuccess={handleSuccess}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SupplierPage;
