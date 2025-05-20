const { Order, OrderItem, Product, User } = require("../models");
// Import model Order (đơn hàng), OrderItem (chi tiết đơn hàng),
// Product (sản phẩm) và User (người dùng) từ thư mục models

const { Op } = require("sequelize");
// Import Op (Operators) từ Sequelize để xây dựng điều kiện truy vấn
// như LIKE, OR, BETWEEN, v.v.

const sequelize = require("../config/database");
// Import đối tượng Sequelize đã cấu hình để sử dụng transaction
// khi tạo hoặc cập nhật đơn hàng

/**
 * Hàm: getOrders
 * Mục đích: Lấy danh sách đơn hàng với phân trang, tìm kiếm, lọc và sắp xếp
 */
exports.getOrders = async (req, res) => {
  try {
    // --- Đọc tham số truyền vào từ client (query string) ---
    const page = parseInt(req.query.page) || 1;
    // Lấy tham số page (trang hiện tại), chuyển sang số nguyên
    // Nếu không có hoặc không hợp lệ, mặc định = 1

    const limit = parseInt(req.query.limit) || 10;
    // Lấy tham số limit (số bản ghi/trang), chuyển sang số nguyên
    // Nếu không có hoặc không hợp lệ, mặc định = 10

    const offset = (page - 1) * limit;
    // Tính chỉ số offset để phân trang: (trang - 1) * limit

    const search = req.query.search || "";
    // Lấy tham số search (từ khóa tìm kiếm chung), mặc định chuỗi rỗng nếu không truyền

    const status = req.query.status || "";
    // Lấy tham số status (trạng thái đơn hàng), mặc định chuỗi rỗng nếu không truyền

    const startDate = req.query.startDate || "";
    // Lấy tham số startDate (ngày bắt đầu lọc), mặc định chuỗi rỗng nếu không truyền

    const endDate = req.query.endDate || "";
    // Lấy tham số endDate (ngày kết thúc lọc), mặc định chuỗi rỗng nếu không truyền

    const sortBy = req.query.sortBy || "orderDate";
    // Lấy tham số sortBy (trường sắp xếp), mặc định là "orderDate" nếu không truyền

    const sortOrder = req.query.sortOrder || "DESC";
    // Lấy tham số sortOrder (thứ tự sắp xếp), mặc định là "DESC" (giảm dần)

    const includeDeleted = req.query.includeDeleted === "true";
    // Lấy tham số includeDeleted (bao gồm dữ liệu đã xóa mềm hay không)
    // So sánh chuỗi với "true", kết quả true/false

    // --- Xây dựng điều kiện WHERE cho truy vấn ---
    let whereClause = {};
    // Khởi tạo đối tượng điều kiện rỗng

    // 1. Nếu có từ khóa tìm kiếm
    if (search) {
      whereClause = {
        [Op.or]: [
          { orderNumber: { [Op.like]: `%${search}%` } },
          // Tìm các đơn hàng có orderNumber chứa search

          { customerName: { [Op.like]: `%${search}%` } },
          // Tìm các đơn hàng có tên khách hàng chứa search

          { customerPhone: { [Op.like]: `%${search}%` } },
          // Tìm các đơn hàng có số điện thoại khách chứa search

          { customerEmail: { [Op.like]: `%${search}%` } },
          // Tìm các đơn hàng có email khách chứa search
        ],
      };
    }

    // 2. Lọc theo trạng thái đơn hàng nếu truyền status
    if (status) {
      whereClause.status = status;
      // Thêm điều kiện status = giá trị truyền vào
    }

    // 3. Lọc theo khoảng thời gian đặt hàng (orderDate)
    if (startDate && endDate) {
      // Nếu cùng cả startDate và endDate
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
        // Điều kiện orderDate BETWEEN startDate AND endDate
      };
    } else if (startDate) {
      // Nếu chỉ có startDate
      whereClause.orderDate = {
        [Op.gte]: new Date(startDate),
        // Điều kiện orderDate >= startDate
      };
    } else if (endDate) {
      // Nếu chỉ có endDate
      whereClause.orderDate = {
        [Op.lte]: new Date(endDate),
        // Điều kiện orderDate <= endDate
      };
    }

    // 4. Khi không bao gồm các đơn hàng đã xóa mềm
    if (!includeDeleted) {
      whereClause.deletedAt = null;
      // Thêm điều kiện deletedAt = null
    }

    // --- Thực hiện truy vấn với phân trang và đếm tổng số ---
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      // Áp dụng điều kiện where đã xây dựng

      include: [
        {
          model: OrderItem,
          as: "items",
          // Thông tin chi tiết mặt hàng trong đơn
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "code"],
              // Chỉ lấy các trường id, name, code của sản phẩm
            },
          ],
        },
        {
          model: User,
          as: "user",
          // Thông tin người dùng (người tạo đơn)
          attributes: ["id", "username", "email", "fullName"],
          // Chỉ lấy id, username, email, fullName để giảm tải
        },
      ],

      order: [[sortBy, sortOrder]],
      // Sắp xếp theo trường sortBy và thứ tự sortOrder

      limit, // Giới hạn số bản ghi trả về
      offset, // Bỏ qua offset bản ghi phía trước (phân trang)

      distinct: true,
      // Đảm bảo đếm count đúng vì khi join có thể dẫn đến trùng lặp
    });

    // --- Trả về kết quả cùng thông tin phân trang ---
    res.status(200).json({
      orders, // Mảng đơn hàng (kèm items và user)
      totalItems: count, // Tổng số bản ghi thỏa mãn điều kiện
      totalPages: Math.ceil(count / limit),
      // Tổng số trang = ceil(totalItems / limit)
      currentPage: page, // Trang hiện tại
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    // In lỗi ra console để debug

    res.status(500).json({
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message,
    });
    // Trả về lỗi 500 nếu có exception
  }
};

/**
 * Hàm: searchOrders
 * Mục đích: Tìm kiếm đơn hàng cho tính năng autocomplete (gợi ý)
 */
exports.searchOrders = async (req, res) => {
  try {
    // --- Lấy tham số truy vấn từ client ---
    const { query, field = "orderNumber", limit = 10 } = req.query;
    // - query: chuỗi tìm kiếm người dùng gõ
    // - field: trường cần search (mặc định "orderNumber")
    // - limit: số kết quả tối đa (mặc định 10)

    // Nếu không có query (chuỗi tìm kiếm rỗng), trả về mảng rỗng
    if (!query) {
      return res.status(200).json([]);
    }

    let whereClause = {};
    // Khởi tạo điều kiện where trống

    let attributes = [];
    // Khởi tạo danh sách trường cần lấy ra từ DB

    // --- Xác định hành vi tìm kiếm tùy theo field ---
    switch (field) {
      case "orderNumber":
        whereClause = {
          orderNumber: { [Op.like]: `%${query}%` },
          // Tìm orderNumber LIKE %query%
        };
        attributes = ["id", "orderNumber"];
        // Trả về id, orderNumber
        break;

      case "customerName":
        whereClause = {
          customerName: { [Op.like]: `%${query}%` },
          // Tìm customerName LIKE %query%
        };
        attributes = ["id", "orderNumber", "customerName"];
        // Trả về id, orderNumber, customerName
        break;

      case "customerPhone":
        whereClause = {
          customerPhone: { [Op.like]: `%${query}%` },
          // Tìm customerPhone LIKE %query%
        };
        attributes = ["id", "orderNumber", "customerPhone"];
        // Trả về id, orderNumber, customerPhone
        break;

      default:
        whereClause = {
          [field]: { [Op.like]: `%${query}%` },
          // Nếu field khác, tìm theo trường đó LIKE %query%
        };
        attributes = ["id", "orderNumber", field];
      // Trả về id, orderNumber, và giá trị của field đó
    }

    // --- Thực hiện truy vấn tìm kiếm ---
    const results = await Order.findAll({
      where: whereClause,
      // Áp dụng điều kiện tìm kiếm

      attributes,
      // Chỉ lấy những trường đã xác định để giảm tải

      limit: parseInt(limit),
      // Giới hạn số kết quả trả về
    });

    // Trả về mảng kết quả
    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching orders:", error);
    // In lỗi ra console

    res.status(500).json({
      message: "Lỗi khi tìm kiếm đơn hàng",
      error: error.message,
    });
    // Trả về lỗi 500 nếu có exception
  }
};

/**
 * Hàm: getOrderById
 * Mục đích: Lấy chi tiết một đơn hàng theo ID (kèm thông tin items và user)
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id của đơn hàng từ tham số URL

    // Tìm đơn hàng theo primary key, bao gồm items (chi tiết mặt hàng) và user (người tạo)
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          // Thông tin chi tiết mặt hàng trong đơn
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "code", "price"],
              // Chỉ lấy id, name, code, price của sản phẩm
            },
          ],
        },
        {
          model: User,
          as: "user",
          // Thông tin người dùng (người tạo đơn)
          attributes: ["id", "username", "email", "fullName"],
          // Chỉ lấy id, username, email, fullName
        },
      ],
    });

    if (!order) {
      // Nếu không tìm thấy đơn hàng theo id
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Trả về đối tượng order kèm các thông tin liên quan
    res.status(200).json(order);
  } catch (error) {
    console.error("Error getting order:", error);
    // In lỗi ra console

    res.status(500).json({
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message,
    });
    // Trả về lỗi 500 nếu có exception
  }
};

/**
 * Hàm: createOrder
 * Mục đích: Tạo đơn hàng mới, kèm chi tiết mặt hàng, sử dụng transaction
 */
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  // Mở transaction, nếu có lỗi sẽ rollback

  try {
    // --- Lấy các trường dữ liệu từ request body ---
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderDate,
      userId,
      customerId,
      items,
      discount,
      tax,
      paymentMethod,
      shippingMethod,
      notes,
      status,
      paymentStatus,
    } = req.body;
    // - customerName: tên khách hàng
    // - customerPhone: số điện thoại khách hàng
    // - customerEmail: email khách hàng
    // - customerAddress: địa chỉ khách hàng
    // - orderDate: ngày đặt hàng (nếu không truyền, mặc định ngày hiện tại)
    // - userId: id người tạo đơn (nếu có)
    // - customerId: id khách hàng (nếu lưu sẵn trong hệ thống)
    // - items: mảng chi tiết mặt hàng [{ productId, quantity, price, discount?, notes? }, ...]
    // - discount: tổng giảm giá áp dụng cho đơn hàng
    // - tax: thuế áp dụng cho đơn hàng
    // - paymentMethod: phương thức thanh toán
    // - shippingMethod: phương thức giao hàng
    // - notes: ghi chú chung của đơn hàng
    // - status: trạng thái đơn hàng (mặc định "pending")
    // - paymentStatus: trạng thái thanh toán (mặc định "unpaid")

    // 1. Validate các trường bắt buộc
    if (!customerName || !customerPhone || !items || !items.length) {
      await transaction.rollback();
      // Rollback transaction nếu thiếu thông tin bắt buộc

      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // 2. Tính tổng sơ bộ (total) của các mặt hàng
    let total = 0;
    for (const item of items) {
      // Kiểm tra thông tin cơ bản của từng item
      if (!item.productId || !item.quantity || !item.price) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Thông tin sản phẩm không hợp lệ" });
      }

      // Lấy thông tin sản phẩm từ DB để xác nhận tồn tại
      const product = await Product.findByPk(item.productId);
      if (!product) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: `Sản phẩm ID ${item.productId} không tồn tại` });
      }

      // Tính tổng tiền của từng item = price * quantity - (discount nếu có)
      const itemTotal = item.price * item.quantity - (item.discount || 0);
      total += itemTotal;
      // Cộng dồn vào tổng của toàn bộ đơn hàng
    }

    // 3. Tính grandTotal áp dụng discount và tax
    const discountAmount = discount || 0;
    // Nếu không có discount (undefined hoặc null), gán = 0

    const taxAmount = tax || 0;
    // Nếu không có tax, gán = 0

    const grandTotal = total - discountAmount + taxAmount;
    // Grand total = tổng hàng - giảm giá + thuế

    // 4. Tạo bản ghi Order trong DB trong context transaction
    const newOrder = await Order.create(
      {
        customerName, // Tên khách hàng
        customerPhone, // Số điện thoại khách hàng
        customerEmail, // Email khách hàng
        customerAddress, // Địa chỉ khách hàng
        orderDate: orderDate || new Date(),
        // Ngày đặt hàng, nếu không truyền thì dùng ngày hiện tại

        userId, // ID người tạo đơn
        customerId, // ID khách hàng (nếu có)

        total, // Tổng tiền chưa áp dụng discount/tax
        discount: discountAmount, // Số tiền giảm giá
        tax: taxAmount, // Số tiền thuế
        grandTotal, // Tổng cuối cùng

        paymentMethod, // Phương thức thanh toán
        shippingMethod, // Phương thức giao hàng
        notes, // Ghi chú

        status: status || "pending",
        // Trạng thái đơn, mặc định "pending" nếu không truyền

        paymentStatus: paymentStatus || "unpaid",
        // Trạng thái thanh toán, mặc định "unpaid" nếu không truyền
      },
      { transaction }
      // Thực hiện trong transaction để rollback nếu có lỗi
    );

    // 5. Tạo chi tiết OrderItem cho từng mặt hàng
    for (const item of items) {
      // Lấy thông tin sản phẩm một lần nữa (để lấy tên, mã)
      const product = await Product.findByPk(item.productId);

      await OrderItem.create(
        {
          orderId: newOrder.id, // Liên kết tới đơn hàng vừa tạo
          productId: item.productId, // ID sản phẩm
          productName: product.name, // Lưu tên sản phẩm tại thời điểm tạo
          productCode: product.code, // Lưu mã sản phẩm

          quantity: item.quantity, // Số lượng đặt
          price: item.price, // Đơn giá
          discount: item.discount || 0, // Giảm giá cho item (nếu có)

          total: item.price * item.quantity - (item.discount || 0),
          // Tổng tiền của item

          notes: item.notes, // Ghi chú riêng cho item (nếu có)
        },
        { transaction }
      );

      // Nếu cần quản lý tồn kho, có thể chạy đoạn code sau:
      /*
      await Product.update(
        { quantity: sequelize.literal(`quantity - ${item.quantity}`) },
        { where: { id: item.productId }, transaction }
      );
      */
    }

    // 6. Commit transaction nếu mọi thứ thành công
    await transaction.commit();

    // 7. Lấy lại đơn hàng vừa tạo (kèm thông tin các items) để trả về client
    const createdOrder = await Order.findByPk(newOrder.id, {
      include: [{ model: OrderItem, as: "items" }],
      // Lấy kèm danh sách items (thông tin chi tiết)
    });

    // 8. Trả về kết quả thành công
    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order: createdOrder,
    });
  } catch (error) {
    // Nếu có bất kỳ lỗi nào xảy ra, rollback transaction
    await transaction.rollback();
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Lỗi khi tạo đơn hàng",
      error: error.message,
    });
  }
};

/**
 * Hàm: updateOrder
 * Mục đích: Cập nhật thông tin đơn hàng, có transaction để đảm bảo toàn vẹn dữ liệu
 */
exports.updateOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  // Mở transaction, nếu xảy ra lỗi sẽ rollback

  try {
    const { id } = req.params;
    // Lấy id đơn hàng cần cập nhật từ tham số URL

    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderDate,
      userId,
      customerId,
      items,
      discount,
      tax,
      paymentMethod,
      shippingMethod,
      notes,
      status,
      paymentStatus,
    } = req.body;
    // Lấy các trường mới từ request body

    // 1. Kiểm tra đơn hàng tồn tại
    const order = await Order.findByPk(id);
    if (!order) {
      await transaction.rollback();
      // Rollback nếu không tìm thấy đơn hàng
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // 2. Kiểm tra thông tin khách hàng bắt buộc
    if (!customerName || !customerPhone) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Thiếu thông tin khách hàng bắt buộc" });
    }

    // 3. Xử lý danh sách items (nếu client truyền lên)
    let total = 0;
    if (items && items.length > 0) {
      // Nếu có items mới, xóa hết các OrderItem cũ của đơn hàng này
      await OrderItem.destroy({ where: { orderId: id }, transaction });

      // Tạo item mới và tính tổng
      for (const item of items) {
        // Kiểm tra item hợp lệ
        if (!item.productId || !item.quantity || !item.price) {
          await transaction.rollback();
          return res
            .status(400)
            .json({ message: "Thông tin sản phẩm không hợp lệ" });
        }

        // Xác nhận sản phẩm tồn tại
        const product = await Product.findByPk(item.productId);
        if (!product) {
          await transaction.rollback();
          return res
            .status(400)
            .json({ message: `Sản phẩm ID ${item.productId} không tồn tại` });
        }

        // Tính tổng cho từng item
        const itemTotal = item.price * item.quantity - (item.discount || 0);
        total += itemTotal;

        // Tạo OrderItem mới trong context transaction
        await OrderItem.create(
          {
            orderId: id, // Liên kết đến đơn hàng
            productId: item.productId,
            productName: product.name,
            productCode: product.code,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: itemTotal,
            notes: item.notes,
          },
          { transaction }
        );
      }
    } else {
      // Nếu không truyền items, giữ nguyên tổng cũ
      total = order.total;
    }

    // 4. Tính grandTotal mới: total - discount + tax
    const discountAmount = discount !== undefined ? discount : order.discount;
    // Nếu client truyền discount mới thì dùng, nếu không giữ nguyên
    const taxAmount = tax !== undefined ? tax : order.tax;
    // Tương tự cho tax
    const grandTotal = total - discountAmount + taxAmount;
    // Tính grandTotal

    // 5. Cập nhật thông tin đơn hàng (trong context transaction)
    await order.update(
      {
        customerName: customerName || order.customerName,
        // Cập nhật customerName nếu có, ngược lại giữ nguyên

        customerPhone: customerPhone || order.customerPhone,
        // Cập nhật customerPhone tương tự

        customerEmail:
          customerEmail !== undefined ? customerEmail : order.customerEmail,
        // Cập nhật customerEmail nếu truyền, ngược lại giữ nguyên

        customerAddress:
          customerAddress !== undefined
            ? customerAddress
            : order.customerAddress,
        // Cập nhật customerAddress nếu truyền, ngược lại giữ nguyên

        orderDate: orderDate || order.orderDate,
        // Cập nhật orderDate nếu truyền, ngược lại giữ nguyên

        userId: userId !== undefined ? userId : order.userId,
        // Cập nhật userId nếu truyền, ngược lại giữ nguyên

        customerId: customerId !== undefined ? customerId : order.customerId,
        // Cập nhật customerId nếu truyền, ngược lại giữ nguyên

        total, // Cập nhật tổng tiền mới
        discount: discountAmount,
        tax: taxAmount,
        grandTotal, // Cập nhật grandTotal mới

        paymentMethod:
          paymentMethod !== undefined ? paymentMethod : order.paymentMethod,
        // Cập nhật paymentMethod nếu truyền, ngược lại giữ nguyên

        shippingMethod:
          shippingMethod !== undefined ? shippingMethod : order.shippingMethod,
        // Cập nhật shippingMethod nếu truyền, ngược lại giữ nguyên

        notes: notes !== undefined ? notes : order.notes,
        // Cập nhật ghi chú nếu truyền, ngược lại giữ nguyên

        status: status || order.status,
        // Cập nhật status nếu truyền, ngược lại giữ nguyên

        paymentStatus: paymentStatus || order.paymentStatus,
        // Cập nhật paymentStatus nếu truyền, ngược lại giữ nguyên
      },
      { transaction }
    );
    // Lưu cập nhật vào DB trong transaction

    // 6. Commit transaction khi mọi thứ thành công
    await transaction.commit();

    // 7. Lấy lại đơn hàng đã cập nhật (kèm items) để trả về cho client
    const updatedOrder = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    res.status(200).json({
      message: "Cập nhật đơn hàng thành công",
      order: updatedOrder,
    });
  } catch (error) {
    // Nếu có lỗi, rollback transaction
    await transaction.rollback();
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật đơn hàng",
      error: error.message,
    });
  }
};

/**
 * Hàm: deleteOrder
 * Mục đích: Xóa mềm một đơn hàng (soft delete)
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id đơn hàng từ tham số URL

    const order = await Order.findByPk(id);
    // Tìm đơn hàng theo primary key
    if (!order) {
      // Nếu không tìm thấy
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Soft delete: cập nhật trường deletedAt = thời gian hiện tại
    await order.update({ deletedAt: new Date() });

    res.status(200).json({ message: "Xóa đơn hàng thành công" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      message: "Lỗi khi xóa đơn hàng",
      error: error.message,
    });
  }
};

/**
 * Hàm: restoreOrder
 * Mục đích: Khôi phục đơn hàng đã xóa mềm (restore)
 */
exports.restoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id đơn hàng từ tham số URL

    const order = await Order.findByPk(id);
    // Tìm đơn hàng theo primary key, bao gồm cả đã xóa mềm
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Restore: đặt deletedAt = null để khôi phục
    await order.update({ deletedAt: null });

    res.status(200).json({ message: "Khôi phục đơn hàng thành công" });
  } catch (error) {
    console.error("Error restoring order:", error);
    res.status(500).json({
      message: "Lỗi khi khôi phục đơn hàng",
      error: error.message,
    });
  }
};

/**
 * Hàm: updateOrderStatus
 * Mục đích: Cập nhật trạng thái (status) của một đơn hàng
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id đơn hàng từ tham số URL

    const { status } = req.body;
    // Lấy giá trị status mới từ request body

    if (!status) {
      // Nếu không truyền status, trả về lỗi
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findByPk(id);
    // Tìm đơn hàng theo id
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật trường status
    await order.update({ status });

    res.status(200).json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      order,
      // Trả về đơn hàng đang cập nhật (có status mới)
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
};

/**
 * Hàm: updatePaymentStatus
 * Mục đích: Cập nhật trạng thái thanh toán (paymentStatus) của một đơn hàng
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy id đơn hàng từ tham số URL

    const { paymentStatus } = req.body;
    // Lấy giá trị paymentStatus mới từ request body

    if (!paymentStatus) {
      // Nếu không truyền paymentStatus, trả về lỗi
      return res.status(400).json({ message: "Payment status is required" });
    }

    const order = await Order.findByPk(id);
    // Tìm đơn hàng theo id
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật trường paymentStatus
    await order.update({ paymentStatus });

    res.status(200).json({
      message: "Cập nhật trạng thái thanh toán thành công",
      order,
      // Trả về đơn hàng với paymentStatus mới
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái thanh toán",
      error: error.message,
    });
  }
};
