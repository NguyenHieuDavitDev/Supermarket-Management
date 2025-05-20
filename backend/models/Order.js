const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "customers",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    grandTotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "completed",
        "cancelled",
        "refunded"
      ),
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("unpaid", "partially_paid", "paid"),
      defaultValue: "unpaid",
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
    paranoid: false, // We'll handle soft deletes manually using the deletedAt field
    hooks: {
      beforeCreate: async (order) => {
        // Generate order number if not set
        if (!order.orderNumber) {
          const date = new Date();
          const year = date.getFullYear().toString().substr(-2);
          const month = ("0" + (date.getMonth() + 1)).slice(-2);
          const day = ("0" + date.getDate()).slice(-2);

          // Get the latest order to generate the next number
          const latestOrder = await Order.findOne({
            order: [["id", "DESC"]],
          });

          let sequence = 1;
          if (latestOrder) {
            const lastNumber = latestOrder.orderNumber;
            // Extract the numeric part if it matches our format (e.g., ORD-YYMMDD-123)
            const match = lastNumber.match(/ORD-\d{6}-(\d+)/);
            if (match && match[1]) {
              sequence = parseInt(match[1], 10) + 1;
            }
          }

          // Format: ORD-YYMMDD-SEQUENCE
          order.orderNumber = `ORD-${year}${month}${day}-${sequence
            .toString()
            .padStart(3, "0")}`;
        }
      },
    },
  }
);

module.exports = Order;
