import React, { useState } from "react"; // Import React và useState hook để quản lý state trong component
import { Carousel, Button, Container } from "react-bootstrap"; // Import Carousel, Button, Container từ React Bootstrap để dùng UI components
import { Link } from "react-router-dom"; // Import Link từ React Router để điều hướng nội bộ
import { FaArrowRight, FaShoppingBag, FaGift, FaImages } from "react-icons/fa"; // Import các icon từ react-icons/fa

const Banner = () => {
  // Khai báo component Banner
  const [imageErrors, setImageErrors] = useState({}); // State lưu object đánh dấu banner nào bị lỗi tải ảnh

  const [banners, setBanners] = useState([
    // State lưu mảng các banner
    {
      // Banner thứ nhất
      id: 1, // id duy nhất của banner
      image:
        "https://cdnv2.tgdd.vn/bhx-static/bhx/7910/hero-banner-pc_202503180902592791.jpg", // URL ảnh banner
      title: "Khuyến Mãi Mùa Hè", // Tiêu đề banner
      description:
        "Giảm đến 50% cho các sản phẩm mùa hè. Chỉ áp dụng trong tháng 6!", // Mô tả banner
      buttonText: "Mua ngay", // Văn bản nút bấm
      link: "/store/products", // Đường dẫn khi nhấn nút
      icon: <FaShoppingBag />, // Icon xuất hiện trên nút
      textColor: "text-white", // Lớp CSS màu chữ
      buttonVariant: "light", // Variant của Button (React Bootstrap)
      bgColor: "#007bff", // Màu nền khi placeholder (nếu ảnh lỗi)
    },
    {
      // Banner thứ hai
      id: 2,
      image:
        "https://cdnv2.tgdd.vn/bhx-static/bhx/7910/freecompress-pc-1800x480-2_202503061602312848.jpg",
      title: "Sản Phẩm Mới Ra Mắt",
      description:
        "Khám phá các sản phẩm mới nhất vừa được cập nhật trong cửa hàng",
      buttonText: "Xem ngay",
      link: "/store/products",
      icon: <FaArrowRight />,
      textColor: "text-white",
      buttonVariant: "outline-light",
      bgColor: "#28a745",
    },
    {
      // Banner thứ ba
      id: 3,
      image:
        "https://cdnv2.tgdd.vn/bhx-static/bhx/7910/freecompress-image-4-compressed_202503181116429423.jpg",
      title: "Ưu Đãi Đặc Biệt",
      description: "Giảm 30% cho đơn hàng đầu tiên khi đăng ký thành viên mới",
      buttonText: "Đăng ký",
      link: "/store/login",
      icon: <FaGift />,
      textColor: "text-white",
      buttonVariant: "light",
      bgColor: "#dc3545",
    },
  ]);

  const handleImageError = (bannerId) => {
    // khi ảnh banner tải lỗi
    setImageErrors((prev) => ({
      // Cập nhật imageErrors
      ...prev, // Giữ lại các lỗi cũ
      [bannerId]: true, // Đánh dấu bannerId bị lỗi
    }));
  };

  const renderBannerImage = (banner) => {
    // Hàm hiển thị ảnh hoặc placeholder
    if (imageErrors[banner.id]) {
      // Nếu banner.id có lỗi trong imageErrors
      return (
        // Trả về placeholder
        <div
          className="d-flex align-items-center justify-content-center w-100 h-100" // Canh giữa cả chiều ngang + dọc
          style={{ backgroundColor: banner.bgColor || "#6c757d" }} // Màu nền từ banner.bgColor hoặc màu mặc định xám
        >
          <FaImages size={60} color="white" className="me-3" />
          {/* Hiển thị icon placeholder */}
          <div className="text-white">
            {" "}
            {/* Thông tin thay thế */}
            <h3>{banner.title}</h3>
            {/* Tiêu đề banner */}
            <p className="mb-0">{banner.description}</p>
            {/* Mô tả banner */}
          </div>
        </div>
      );
    }

    return (
      // Nếu không lỗi, trả về thẻ <img>
      <img
        className="d-block w-100 h-100 object-fit-cover" // Lớp CSS để lấp đầy container và giữ tỉ lệ
        src={banner.image} // Nguồn ảnh từ banner.image
        alt={banner.title} // Thuộc tính alt là title
        style={{ objectPosition: "center" }} // Canh điểm ảnh giữa
        onError={() => handleImageError(banner.id)} // Khi load lỗi, gọi handleImageError với id
      />
    );
  };

  if (!banners || banners.length === 0) {
    // Nếu mảng banners rỗng hoặc undefined
    return (
      // Trả về một banner mặc định
      <div className="banner-container mb-5">
        <div
          className="d-flex align-items-center justify-content-center text-white text-center" // Canh giữa, chữ trắng, text-center
          style={{
            height: "300px", // Chiều cao cố định 300px
            backgroundColor: "#0d6efd", // Màu nền xanh dương
            borderRadius: ".25rem", // Bo góc
          }}
        >
          <div>
            <FaImages size={60} className="mb-3" />
            {/* Icon placeholder */}
            <h2>Chào mừng đến với cửa hàng</h2>
            <p className="mb-4">
              {" "}
              {/* Mô tả ngắn Khám phá các sản phẩm tuyệt vời của chúng tôi */}
            </p>
            <Button as={Link} to="/store/products" variant="light" size="lg">
              Mua sắm ngay // Nút dẫn đến trang sản phẩm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Nếu có banner, hiển thị Carousel
    <div className="banner-container mb-5">
      <Carousel
        className="shadow-sm rounded overflow-hidden" // Thêm shadow, bo góc và ẩn phần tràn
        interval={5000} // Tự động chuyển slide sau 5 giây
        indicators={true} // Hiển thị chấm chỉ mục slide
        controls={banners.length > 1} // Nếu chỉ 1 banner, ẩn nút next/prev
        fade={true} // Hiệu ứng mờ dần khi chuyển slide
      >
        {banners.map(
          (
            banner // Lặp mảng banners
          ) => (
            <Carousel.Item key={`banner-${banner.id}`}>
              <div
                className="banner-image-container"
                style={{
                  height: "300px", // Chiều cao cố định 300px
                  backgroundColor: banner.bgColor || "#f8f9fa", // Màu nền khung chứa ảnh
                }}
              >
                {renderBannerImage(banner)}
                {/* Gọi hàm renderBannerImage */}
              </div>
              <Carousel.Caption className="text-start carousel-caption-custom">
                <Container className="py-4">
                  {" "}
                  {/* Bọc nội dung caption với padding y = 4 */}
                  <div
                    className="bg-dark bg-opacity-50 p-4 rounded shadow-lg" // Nền đen 50% opacity, padding 4, bo góc, shadow
                    style={{ maxWidth: "600px" }} // Giới hạn chiều rộng caption 600px
                  >
                    <h2 className={`display-6 fw-bold ${banner.textColor}`}>
                      {banner.title}
                      {/* Hiển thị tiêu đề banner, áp class textColor */}
                    </h2>
                    <p className={`lead mb-4 ${banner.textColor}`}>
                      {banner.description}
                      {/* Hiển thị mô tả banner, áp class textColor */}
                    </p>
                    <Button
                      as={Link} // Nút được render như Link
                      to={banner.link || "/store/products"} // Liên kết đến banner.link hoặc mặc định trang sản phẩm
                      variant={banner.buttonVariant || "light"} // Variant nút (light hoặc outline-light, v.v.)
                      size="lg" // Kích thước Large
                      className="fw-bold px-4 py-2" // Chữ in đậm, padding x=4, y=2
                    >
                      {banner.buttonText || "Mua ngay"}
                      {/* Hiển thị văn bản nút hoặc mặc định "Mua ngay" */}
                      {banner.icon && (
                        <span className="ms-2">{banner.icon}</span>
                      )}
                      {/* Nếu có icon, hiển thị icon bên phải và cách lề trái ms-2 */}
                    </Button>
                  </div>
                </Container>
              </Carousel.Caption>
            </Carousel.Item>
          )
        )}
      </Carousel>
    </div>
  );
};

export default Banner; // Xuất component Banner để có thể import và sử dụng ở component khác
