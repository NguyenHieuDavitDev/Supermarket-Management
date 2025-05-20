const { Product, ProductImage, Category, Supplier } = require("../models");
// Import các model: Product (sản phẩm), ProductImage (hình ảnh sản phẩm), Category (danh mục), Supplier (nhà cung cấp)
// để thao tác với cơ sở dữ liệu thông qua Sequelize

const { Op } = require("sequelize");
// Import Op (Operators) từ Sequelize để xây dựng các điều kiện truy vấn nâng cao (như LIKE, OR, v.v.)

const fs = require("fs");
// Import fs (file system) để thao tác với hệ thống file: đọc, xóa, kiểm tra thư mục, v.v.

const path = require("path");
// Import path để xử lý đường dẫn, phần mở rộng, và kết hợp các đoạn đường dẫn một cách an toàn

// Hàm helper để lưu file vào ổ cứng
const saveFile = (file, folder = "products") => {
  try {
    const uploadDir = path.join(__dirname, "..", "uploads", folder);
    // Xác định thư mục lưu file: /project/uploads/<folder> (mặc định folder = "products")

    const filename = `${folder}-${Date.now()}-${path.basename(file.path)}`;
    // Tạo tên file tiến độ từ:
    //   prefix là tên folder + dấu gạch nối
    //   timestamp hiện tại (Date.now())
    //   tên gốc của file tạm (basename(file.path))
    // Ví dụ: "products-1689000000000-abc123.tmp.jpg"

    const targetPath = path.join(uploadDir, filename);
    // Xác định đường dẫn đầy đủ đến file đích: /project/uploads/<folder>/<filename>

    // Đảm bảo thư mục uploadDir tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      // Nếu chưa tồn tại, tạo mới cả cây thư mục (recursive: true)
    }

    // Copy file từ đường dẫn tạm file.path sang thư mục đích targetPath
    fs.copyFileSync(file.path, targetPath);

    return {
      url: `/uploads/${folder}/${filename}`,
      // Trả về URL công khai để client có thể truy cập file (ví dụ: "/uploads/products/products-...jpg")
      publicId: filename,
      // Trả về publicId, tức tên file lưu trên server, để có thể xóa sau này
    };
  } catch (error) {
    console.error("Error saving file:", error);
    // Nếu có lỗi khi lưu file, log ra console để debug

    return {
      url: null,
      publicId: null,
      // Trả về null nếu không lưu được file
    };
  }
};

// Hàm helper để xóa file khỏi ổ cứng
const deleteFile = (publicId) => {
  try {
    if (!publicId) return;
    // Nếu không có publicId (ví dụ: không có file), quay về ngay

    const filePath = path.join(__dirname, "..", publicId.replace(/^\//, ""));
    // publicId có thể chứa dấu "/" ở đầu (ví dụ: "/uploads/products/...");
    // nên loại bỏ dấu "/" đầu tiên rồi ghép với __dirname để tạo đường dẫn tuyệt đối

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      // Nếu file tồn tại, xóa file đó
      return true;
    }
    return false;
    // Nếu file không tồn tại, trả về false
  } catch (error) {
    console.error("Error deleting file:", error);
    // Nếu có lỗi khi xóa file, log ra console

    return false;
    // Trả về false nếu xóa không thành công
  }
};

// Lấy danh sách sản phẩm (hỗ trợ phân trang, tìm kiếm, sắp xếp, và bao gồm/exclude đã xóa mềm)
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Lấy số trang hiện tại từ query string, mặc định 1 nếu không truyền hoặc không hợp lệ

    const limit = parseInt(req.query.limit) || 10;
    // Lấy số bản ghi/trang (limit) từ query string, mặc định 10 nếu không truyền

    const offset = (page - 1) * limit;
    // Tính offset cho việc phân trang: (trang hiện tại - 1) * số bản ghi/trang

    const search = req.query.search || "";
    // Lấy từ khóa tìm kiếm (search) từ query string, mặc định chuỗi rỗng nếu không truyền

    const sortField = req.query.sortField || "createdAt";
    // Lấy trường cần sắp xếp (sortField) từ query string, mặc định "createdAt" nếu không truyền

    const sortOrder = req.query.sortOrder || "DESC";
    // Lấy thứ tự sắp xếp (sortOrder) từ query string, có thể "ASC" hoặc "DESC", mặc định "DESC"

    const includeDeleted = req.query.includeDeleted === "true";
    // Lấy option includeDeleted: nếu query string includeDeleted = "true" thì includeDeleted = true, ngược lại false

    // Xây dựng điều kiện where cho truy vấn
    let whereClause = {};

    // Nếu có từ khóa tìm kiếm
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          // Tìm name chứa từ search (SQL LIKE %search%)

          { code: { [Op.like]: `%${search}%` } },
          // Tìm code chứa từ search

          { description: { [Op.like]: `%${search}%` } },
          // Tìm description chứa từ search
        ],
      };
    }

    // Nếu không bao gồm đã xóa mềm
    if (!includeDeleted) {
      whereClause.deletedAt = null;
      // Giới hạn chỉ lấy các bản ghi chưa bị xóa mềm (deletedAt = null)
    }

    // Thực hiện truy vấn: findAndCountAll để vừa lấy bản ghi, vừa đếm tổng số
    const { rows: products, count: total } = await Product.findAndCountAll({
      where: whereClause, // Điều kiện lọc
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
          // Join với bảng Category, alias "category", chỉ lấy id và name
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "name"],
          // Join với bảng Supplier, alias "supplier", chỉ lấy id và name
        },
        {
          model: ProductImage,
          as: "images",
          // Join với bảng ProductImage, alias "images" để lấy danh sách hình ảnh
        },
      ],
      order: [[sortField, sortOrder]],
      // Sắp xếp theo sortField và sortOrder

      limit, // Số bản ghi lấy
      offset, // Bỏ qua offset bản ghi phía trước (phân trang)
      distinct: true,
      // distinct: true để đảm bảo count tính đúng số bản ghi (khi join có thể nhân đôi)
    });

    // Trả về kết quả cùng thông tin phân trang
    res.status(200).json({
      products, // Mảng sản phẩm (có đầy đủ các quan hệ category, supplier, images)
      totalPages: Math.ceil(total / limit),
      // Tổng số trang = ceil(tổng bản ghi / limit)

      currentPage: page,
      // Trang hiện tại

      totalItems: total,
      // Tổng số bản ghi tìm được
    });
  } catch (error) {
    console.error("Error getting products:", error);
    // Nếu có lỗi, log ra console

    res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
    // Trả về lỗi 500 cho client
  }
};

// Lấy thông tin chi tiết một sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id sản phẩm từ tham số URL (req.params.id)

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
          // Join với Category (danh mục), chỉ lấy id, name
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "name"],
          // Join với Supplier (nhà cung cấp), chỉ lấy id, name
        },
        {
          model: ProductImage,
          as: "images",
          // Join với ProductImage (hình ảnh sản phẩm)
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      // Nếu không tìm thấy sản phẩm, trả về lỗi 404
    }

    res.status(200).json(product);
    // Nếu tìm thấy, trả về đối tượng product cùng các quan hệ
  } catch (error) {
    console.error("Error getting product:", error);
    // Nếu có lỗi, log ra console

    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
    // Trả về lỗi 500 cho client
  }
};

// Hàm để sinh mã sản phẩm tự động (nếu người dùng không cung cấp)
const generateProductCode = async (prefix = "P") => {
  try {
    // Lấy tất cả các sản phẩm hiện có có mã bắt đầu bằng prefix
    const products = await Product.findAll({
      where: {
        code: {
          [Op.like]: `${prefix}%`,
          // Tìm record code LIKE "P%"
        },
      },
      attributes: ["code"],
      raw: true,
      // raw: true để lấy về mảng thuần, không phải instance của Sequelize
    });

    // Tìm số lớn nhất trong phần số đằng sau prefix
    let maxNumber = 0;
    products.forEach((product) => {
      // Với mỗi product có mã ví dụ "P000123", ta lấy phần "000123"
      const codeNumber = parseInt(product.code.replace(prefix, ""), 10);
      // Chuyển phần số thành integer
      if (!isNaN(codeNumber) && codeNumber > maxNumber) {
        maxNumber = codeNumber;
      }
    });

    // Số tiếp theo = maxNumber + 1
    const nextNumber = maxNumber + 1;
    // Format với 6 chữ số, ví dụ 7 -> "000007"
    return `${prefix}${nextNumber.toString().padStart(6, "0")}`;
    // Trả về mã hoàn chỉnh, ví dụ "P000007"
  } catch (error) {
    console.error("Error generating product code:", error);
    // Nếu có lỗi, log ra console

    return `${prefix}${Date.now()}`;
    // Fallback: prefix + timestamp (đảm bảo không trùng)
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      code: customCode,
      categoryId,
      supplierId,
      description,
      price,
      quantity,
      status,
    } = req.body;
    // Lấy các trường từ body:
    //   name (tên sản phẩm),
    //   customCode (mã do user tự nhập, có thể null),
    //   categoryId, supplierId (quan hệ),
    //   description (mô tả), price, quantity, status (trạng thái)

    // Sử dụng mã tùy chỉnh nếu được cung cấp, nếu không thì sinh tự động
    let code = customCode;
    if (!code || code.trim() === "") {
      // Nếu customCode không tồn tại hoặc chỉ toàn khoảng trắng
      code = await generateProductCode();
      // Gọi hàm generateProductCode để tạo mã mới
    } else {
      // Nếu customCode có giá trị, kiểm tra đã tồn tại trong DB chưa
      const existingProduct = await Product.findOne({ where: { code } });
      if (existingProduct) {
        return res.status(400).json({ message: "Mã sản phẩm đã tồn tại" });
        // Nếu tồn tại, trả về lỗi 400
      }
    }

    // Tạo bản ghi Product mới trong DB
    const newProduct = await Product.create({
      name, // Tên sản phẩm
      code, // Mã sản phẩm (tự sinh hoặc do user nhập)
      categoryId, // ID danh mục
      supplierId, // ID nhà cung cấp
      description, // Mô tả
      price, // Giá
      quantity, // Số lượng
      status: status || "active",
      // Trạng thái: nếu không truyền status, mặc định "active"
    });

    // Xử lý upload hình ảnh (nếu có)
    const imageResults = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // req.files chứa mảng file upload (tuỳ thuộc middleware ở route)

      const imagePromises = req.files.map((file, index) => {
        try {
          // Lưu file vào thư mục /uploads/products
          const fileData = saveFile(file, "products");
          if (!fileData.url) {
            return null;
          }
          // Tạo bản ghi ProductImage liên kết với newProduct.id
          return ProductImage.create({
            productId: newProduct.id, // FK liên kết đến sản phẩm vừa tạo
            url: fileData.url, // URL lưu trữ hình ảnh
            publicId: fileData.publicId, // publicId tên file
            isDefault: index === 0, // Ảnh đầu tiên mặc định = true, các ảnh sau mặc định = false
          });
        } catch (error) {
          console.error("Error processing image:", error);
          return null;
        }
      });

      const results = await Promise.all(imagePromises);
      // Đợi tất cả promise tạo hình ảnh hoàn thành
      imageResults.push(...results.filter(Boolean));
      // Lọc bỏ các giá trị null (nếu có lỗi)
    }

    // Lấy lại đối tượng sản phẩm vừa tạo, kèm danh sách hình ảnh
    const productWithImages = await Product.findByPk(newProduct.id, {
      include: [{ model: ProductImage, as: "images" }],
    });

    res.status(201).json({
      message: "Tạo sản phẩm thành công",
      product: productWithImages,
      // Trả về sản phẩm cùng danh sách hình ảnh
    });
  } catch (error) {
    console.error("Error creating product:", error);
    // Nếu có lỗi trong quá trình tạo sản phẩm hoặc lưu ảnh, log ra console

    res.status(500).json({
      message: "Lỗi khi tạo sản phẩm",
      error: error.message,
      // Trả về lỗi chung 500
    });
  }
};

// Cập nhật thông tin sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id sản phẩm cần cập nhật từ params URL

    const {
      name,
      code,
      categoryId,
      supplierId,
      description,
      price,
      quantity,
      status,
      keepImages,
    } = req.body;
    // Lấy các trường mới từ body, bao gồm:
    //   keepImages: mảng các id hình ảnh muốn giữ lại (chuỗi JSON hoặc undefined)

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra mã sản phẩm đã tồn tại chưa (nếu đổi mã)
    if (code !== product.code) {
      // Nếu code mới khác code cũ
      const existingProduct = await Product.findOne({ where: { code } });
      if (existingProduct) {
        return res.status(400).json({ message: "Mã sản phẩm đã tồn tại" });
      }
    }

    // Cập nhật các trường cơ bản của sản phẩm
    await product.update({
      name,
      code,
      categoryId,
      supplierId,
      description,
      price,
      quantity,
      status,
    });

    // Xử lý danh sách hình ảnh cần giữ lại
    let keepImageIds = [];
    if (keepImages) {
      try {
        // keepImages được truyền dưới dạng JSON-encoded string, parse thành mảng
        keepImageIds = JSON.parse(keepImages);
      } catch (err) {
        console.error("Error parsing keepImages:", err);
      }
    }

    // Lấy tất cả hình ảnh hiện có của sản phẩm
    const existingImages = await ProductImage.findAll({
      where: { productId: id },
    });

    // Xác định hình ảnh nào cần xóa: lấy các hình ảnh hiện có nhưng không nằm trong keepImageIds
    const imagesToDelete = existingImages.filter(
      (img) => !keepImageIds.includes(img.id.toString())
    );

    // Xóa các hình ảnh không còn giữ lại
    for (const img of imagesToDelete) {
      deleteFile(img.publicId);
      // Xóa file thực từ ổ cứng

      await img.destroy();
      // Xóa bản ghi ProductImage khỏi database
    }

    // Xử lý upload hình ảnh mới (nếu có)
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file) => {
        // Lưu file mới
        const fileData = saveFile(file, "products");

        return ProductImage.create({
          productId: id, // Liên kết đến sản phẩm đang cập nhật
          url: fileData.url, // URL file mới
          publicId: fileData.publicId, // publicId tên file
          isDefault: false, // Không đánh dấu mặc định (có thể logic khác set mặc định)
        });
      });

      await Promise.all(imagePromises);
      // Đợi tất cả hình ảnh mới được tạo xong
    }

    // Lấy lại sản phẩm sau khi cập nhật kèm quan hệ Category, Supplier và danh sách hình ảnh
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: Supplier, attributes: ["id", "name"] },
        { model: ProductImage, as: "images" },
      ],
    });

    res.status(200).json({
      message: "Cập nhật sản phẩm thành công",
      product: updatedProduct,
    });
    // Trả về sản phẩm đã cập nhật
  } catch (error) {
    console.error("Error updating product:", error);
    // Nếu có lỗi, log ra console

    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm" });
    // Trả về lỗi 500 cho client
  }
};

// Xóa mềm sản phẩm (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id sản phẩm từ params URL

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Thực hiện soft delete: cập nhật trường deletedAt = thời gian hiện tại
    await product.update({ deletedAt: new Date() });

    res.status(200).json({ message: "Xóa sản phẩm thành công" });
    // Trả về thông báo xóa thành công
  } catch (error) {
    console.error("Error soft deleting product:", error);
    // Nếu có lỗi, log ra console

    res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
    // Trả về lỗi 500 cho client
  }
};

// Khôi phục sản phẩm đã xóa mềm
exports.restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id sản phẩm từ params URL

    // Tìm sản phẩm (bao gồm cả bản ghi đã xóa mềm vì không sử dụng paranoid)
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra sản phẩm đã bị xóa mềm chưa (deletedAt có tồn tại)
    if (!product.deletedAt) {
      return res.status(400).json({ message: "Sản phẩm chưa bị xóa" });
    }

    // Khôi phục sản phẩm: cập nhật deletedAt thành null
    await product.update({ deletedAt: null });

    res.status(200).json({ message: "Khôi phục sản phẩm thành công" });
    // Trả về thông báo khôi phục thành công
  } catch (error) {
    console.error("Error restoring product:", error);
    // Nếu có lỗi, log ra console

    res.status(500).json({ message: "Lỗi khi khôi phục sản phẩm" });
    // Trả về lỗi 500 cho client
  }
};
