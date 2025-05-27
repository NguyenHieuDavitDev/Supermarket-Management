import React, { useEffect, useState } from "react"; // Import React và các hook cần thiết
import { getUsers, deleteUser } from "../services/api"; // Import hàm API để lấy và xóa user
import UserForm from "./UserForm"; // Import component form để thêm/sửa user
import ReactPaginate from "react-paginate"; // Import thư viện phân trang

const UserList = () => {
  // State lưu mảng user lấy từ API
  const [users, setUsers] = useState([]);
  // State lưu user đang được chỉnh sửa (null nếu không có)
  const [editingUser, setEditingUser] = useState(null);
  // State kiểm soát hiển thị modal (form thêm hoặc sửa)
  const [showModal, setShowModal] = useState(false);

  // State cho tìm kiếm: chuỗi nhập vào
  const [searchQuery, setSearchQuery] = useState("");
  // State lưu mảng gợi ý (suggestions) khi nhập tìm kiếm
  const [suggestions, setSuggestions] = useState([]);
  // State lưu trang hiện tại (bắt đầu từ 0)
  const [currentPage, setCurrentPage] = useState(0);
  // Số user hiển thị trên mỗi trang
  const itemsPerPage = 5;

  // Hàm gọi API để lấy toàn bộ user
  const fetchUsers = async () => {
    try {
      const response = await getUsers(); // Gọi hàm API getUsers()
      setUsers(response.data); // Lưu mảng user vào state
    } catch (error) {
      console.error("Error fetching users", error); // Nếu lỗi, show ra console
    }
  };

  // useEffect chạy khi component mount lần đầu tiên
  useEffect(() => {
    fetchUsers(); // Gọi fetchUsers để load dữ liệu
  }, []); // Mảng phụ thuộc rỗng nghĩa là chỉ chạy một lần

  //
  // Cập nhật gợi ý (suggestions) khi searchQuery hoặc users thay đổi
  //
  useEffect(() => {
    // Nếu có nhập searchQuery (không phải chuỗi rỗng hoặc toàn khoảng trắng)
    if (searchQuery.trim() !== "") {
      // Lọc mảng users theo username hoặc email chứa searchQuery (không phân biệt hoa thường)
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      // Lấy tối đa 5 kết quả đầu làm gợi ý
      setSuggestions(filtered.slice(0, 5));
      // Mỗi lần thay đổi tìm kiếm, reset currentPage về 0
      setCurrentPage(0);
    } else {
      // Nếu searchQuery trống, xóa hết gợi ý
      setSuggestions([]);
    }
  }, [searchQuery, users]); // Chạy lại khi searchQuery hoặc users thay đổi

  //
  // Lọc ra mảng user sẽ hiển thị dựa trên searchQuery
  //
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Tính chỉ mục bắt đầu (offset) nếu phân trang
  const offset = currentPage * itemsPerPage;
  // Lấy ra mảng user trên trang hiện tại (từ offset cho đến offset + itemsPerPage)
  const currentUsers = filteredUsers.slice(offset, offset + itemsPerPage);
  // Tính tổng số trang = ceil(tổng filteredUsers / itemsPerPage)
  const pageCount = Math.ceil(filteredUsers.length / itemsPerPage);

  // Hàm xử lý khi người dùng bấm nút phân trang (ReactPaginate trả về selected page)
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected); // Cập nhật state currentPage
  };

  // Hàm xử lý xóa user
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa?")) {
      // Hiển thị confirm browser
      await deleteUser(id); // Gọi API xóa user theo id
      fetchUsers(); // Tải lại danh sách user sau khi xóa
    }
  };

  // Hàm mở modal để thêm user mới
  const openModal = () => {
    setEditingUser(null); // Đặt editingUser = null (không có user nào đang sửa)
    setShowModal(true); // Hiển thị modal
  };

  // Hàm đóng modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="container my-4">
      {" "}
      {/* Container Bootstrap, margin y = 4 */}
      <div className="card shadow">
        {" "}
        {/* Card có bóng (shadow) */}
        {/* Header của card */}
        <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Danh sách người dùng</h5>
          <button className="btn btn-success" onClick={openModal}>
            <i className="fas fa-plus me-1"></i> Thêm mới
          </button>
        </div>
        {/* Body của card */}
        <div className="card-body">
          {/* Popup modal: chỉ hiển thị nếu showModal = true */}
          {showModal && (
            <>
              {/* Thẻ <div className="modal"> để hiện modal */}
              <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    {/* Header của modal */}
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {editingUser
                          ? "Cập nhật người dùng"
                          : "Thêm mới người dùng"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={closeModal} // Đóng modal khi bấm nút X
                      ></button>
                    </div>
                    {/* Body của modal */}
                    <div className="modal-body">
                      <UserForm
                        refreshUsers={() => {
                          fetchUsers(); // Reload lại danh sách user
                          closeModal(); // Đóng modal
                        }}
                        editingUser={editingUser} // Truyền user đang edit (hoặc null)
                        setEditingUser={setEditingUser} // Hàm cập nhật editingUser
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Lớp backdrop phía sau modal */}
              <div
                className="modal-backdrop fade show"
                onClick={closeModal} // Click vào backdrop cũng đóng modal
              ></div>
            </>
          )}

          {/* Phần tìm kiếm */}
          <div className="mb-3 position-relative">
            {/* Input tìm kiếm user */}
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery} // Giá trị điều khiển bởi state searchQuery
              onChange={(e) => setSearchQuery(e.target.value)} // Cập nhật state khi nhập
            />
            {/* Nếu có gợi ý (suggestions không rỗng) thì hiển thị dropdown */}
            {suggestions.length > 0 && (
              <ul
                className="list-group position-absolute"
                style={{ zIndex: 1050, width: "100%" }} // Z-index cao để hiện trên hết
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
              {/* Phần đầu bảng */}
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
                {/* Lặp currentUsers (đã filter + phân trang) */}
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {/* Nếu user.avatar tồn tại, hiển thị ảnh */}
                      {user.avatar && (
                        <img
                          src={`http://localhost:3000/${user.avatar}`} // URL ảnh avatar
                          alt="avatar"
                          className="img-thumbnail"
                          style={{ width: "50px" }}
                        />
                      )}
                    </td>
                    {/* Các nút Sửa và Xóa */}
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => {
                          setEditingUser(user); // Đặt user đang chỉnh sửa
                          setShowModal(true); // Mở modal
                        }}
                      >
                        <i className="fas fa-edit me-1"></i> Sửa
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(user.id)} // Xóa user
                      >
                        <i className="fas fa-trash-alt me-1"></i> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang nếu có nhiều hơn 1 trang */}
          {pageCount > 1 && (
            <ReactPaginate
              previousLabel={"Trước"} // Nhãn nút trước
              nextLabel={"Sau"} // Nhãn nút sau
              breakLabel={"..."} // Nhãn cho phần ngắt trang
              pageCount={pageCount} // Tổng số trang
              onPageChange={handlePageClick} // Hàm xử lý khi bấm nút trang
              marginPagesDisplayed={0} // Số trang hiển thị ở hai đầu
              pageRangeDisplayed={4} // Số trang hiển thị ở giữa
              containerClassName={"pagination justify-content-center mt-3"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link"}
              previousClassName={"page-item"}
              previousLinkClassName={"page-link"}
              nextClassName={"page-item"}
              nextLinkClassName={"page-link"}
              breakClassName={"page-item"}
              breakLinkClassName={"page-link"}
              activeClassName={"active"} // Class cho nút trang đang active
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;
