import React, { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../services/api";
import UserForm from "./UserForm";
import ReactPaginate from "react-paginate";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // State cho tìm kiếm và phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5; // Số dòng trên 1 trang

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Cập nhật gợi ý khi nhập từ khóa
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setCurrentPage(0);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, users]);

  // Lọc danh sách hiển thị dựa vào từ khóa và phân trang
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const offset = currentPage * itemsPerPage;
  const currentUsers = filteredUsers.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa?")) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  const openModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="container my-4">
      <div className="card shadow">
        <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Danh sách người dùng</h5>
          <button className="btn btn-success" onClick={openModal}>
            <i className="fas fa-plus me-1"></i> Thêm mới
          </button>
        </div>
        <div className="card-body">
          {/* Popup modal */}
          {showModal && (
            <>
              <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {editingUser
                          ? "Cập nhật người dùng"
                          : "Thêm mới người dùng"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={closeModal}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <UserForm
                        refreshUsers={() => {
                          fetchUsers();
                          closeModal();
                        }}
                        editingUser={editingUser}
                        setEditingUser={setEditingUser}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Backdrop overlay */}
              <div
                className="modal-backdrop fade show"
                onClick={closeModal}
              ></div>
            </>
          )}

          {/* Tìm kiếm */}
          <div className="mb-3 position-relative">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {suggestions.length > 0 && (
              <ul
                className="list-group position-absolute"
                style={{ zIndex: 1050, width: "100%" }}
              >
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="list-group-item list-group-item-action"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearchQuery(suggestion.username)}
                  >
                    {suggestion.username} - {suggestion.email}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bảng hiển thị danh sách người dùng */}
          <div className="table-responsive">
            <table className="table table-striped table-hover mt-3">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Avatar</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.avatar && (
                        <img
                          src={`http://localhost:3000/${user.avatar}`}
                          alt="avatar"
                          className="img-thumbnail"
                          style={{ width: "50px" }}
                        />
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                      >
                        <i className="fas fa-edit me-1"></i> Sửa
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(user.id)}
                      >
                        <i className="fas fa-trash-alt me-1"></i> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang với 4 nút số luôn */}
          {pageCount > 1 && (
            <ReactPaginate
              previousLabel={"Trước"}
              nextLabel={"Sau"}
              breakLabel={"..."}
              pageCount={pageCount}
              onPageChange={handlePageClick}
              marginPagesDisplayed={0}
              pageRangeDisplayed={4}
              containerClassName={"pagination justify-content-center mt-3"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link"}
              previousClassName={"page-item"}
              previousLinkClassName={"page-link"}
              nextClassName={"page-item"}
              nextLinkClassName={"page-link"}
              breakClassName={"page-item"}
              breakLinkClassName={"page-link"}
              activeClassName={"active"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;
