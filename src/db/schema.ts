import mongoose, { Schema, Model, models, model, Types } from "mongoose";

// --- User Schema ---
export interface IUser {
  _id: Types.ObjectId;
  username: string;
  passwordHash: string;
  role: "Administrator" | "Inventory Manager" | "Cashier" | string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["Administrator", "Inventory Manager", "Cashier"],
      default: "Cashier",
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Category Schema ---
export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

// --- Product Schema ---
export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: Types.ObjectId | string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, sparse: true, index: true },
    description: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    minimumStock: { type: Number, default: 0 },
    unit: { type: String, default: "pcs" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Inventory Schema ---
export interface IInventory {
  _id: Types.ObjectId;
  productId: Types.ObjectId | string;
  quantity: number;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, unique: true, index: true },
    quantity: { type: Number, default: 0, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Stock Movement Schema ---
export interface IStockMovement {
  _id: Types.ObjectId;
  productId: Types.ObjectId | string;
  movementType: "RECEIPT" | "ISSUE" | "SALE" | "REFUND" | "TRANSFER" | "ADJUSTMENT" | string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  performedBy: Types.ObjectId | string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    movementType: {
      type: String,
      required: true,
      enum: ["RECEIPT", "ISSUE", "SALE", "REFUND", "TRANSFER", "ADJUSTMENT"],
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String },
    referenceId: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Purchase Item Schema ---
export interface IPurchaseItem {
  _id: Types.ObjectId;
  purchaseId: Types.ObjectId | string;
  productId: Types.ObjectId | string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    purchaseId: { type: Schema.Types.ObjectId, ref: "Purchase", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantityOrdered: { type: Number, required: true },
    quantityReceived: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Purchase Schema ---
export interface IPurchase {
  _id: Types.ObjectId;
  purchaseNumber: string;
  vendorName?: string;
  paymentTerms?: string;
  expectedDeliveryDate?: Date;
  notes?: string;
  status: "Draft" | "Submitted" | "Partially Received" | "Fully Received" | "Cancelled" | string;
  totalAmount: number;
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: { type: String, required: true, unique: true, index: true },
    vendorName: { type: String, default: "General Tech Supplier" },
    paymentTerms: { type: String, default: "Cash On Delivery" },
    expectedDeliveryDate: { type: Date },
    notes: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Submitted", "Partially Received", "Fully Received", "Cancelled"],
      default: "Draft",
    },
    totalAmount: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Till Session Schema ---
export interface ITillSession {
  _id: Types.ObjectId;
  cashierId: Types.ObjectId | string;
  openingBalance: number;
  expectedBalance?: number;
  closingBalance?: number;
  difference?: number;
  status: "OPEN" | "RECONCILED" | "CLOSED" | string;
  openedAt: Date;
  closedAt?: Date;
}

const TillSessionSchema = new Schema<ITillSession>(
  {
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    openingBalance: { type: Number, required: true },
    expectedBalance: { type: Number },
    closingBalance: { type: Number },
    difference: { type: Number },
    status: { type: String, required: true, enum: ["OPEN", "RECONCILED", "CLOSED"], default: "OPEN" },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Sale Item Schema ---
export interface ISaleItem {
  _id: Types.ObjectId;
  saleId: Types.ObjectId | string;
  productId: Types.ObjectId | string;
  quantity: number;
  unitPrice: number;
  returnedQuantity: number;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    returnedQuantity: { type: Number, default: 0 },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Sale Schema ---
export interface ISale {
  _id: Types.ObjectId;
  saleNumber: string;
  tillSessionId: Types.ObjectId | string;
  cashierId: Types.ObjectId | string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  cashTendered?: number;
  changeAmount?: number;
  notes?: string;
  status: "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED" | string;
  paymentMethod: "CASH" | "CARD" | "MTN_MOMO" | "ORANGE_MONEY" | "BANK_TRANSFER" | string;
  createdAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    saleNumber: { type: String, required: true, unique: true, index: true },
    tillSessionId: { type: Schema.Types.ObjectId, ref: "TillSession", required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    totalAmount: { type: Number, required: true },
    subtotalAmount: { type: Number },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    cashTendered: { type: Number },
    changeAmount: { type: Number },
    notes: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "COMPLETED",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["CASH", "CARD", "MTN_MOMO", "ORANGE_MONEY", "BANK_TRANSFER"],
      default: "CASH",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Refund Item Schema ---
export interface IRefundItem {
  _id: Types.ObjectId;
  refundId: Types.ObjectId | string;
  saleItemId: Types.ObjectId | string;
  productId: Types.ObjectId | string;
  quantity: number;
  unitPrice: number;
  restoredToInventory: boolean;
}

const RefundItemSchema = new Schema<IRefundItem>(
  {
    refundId: { type: Schema.Types.ObjectId, ref: "Refund", required: true, index: true },
    saleItemId: { type: Schema.Types.ObjectId, ref: "SaleItem", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    restoredToInventory: { type: Boolean, default: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Refund Schema ---
export interface IRefund {
  _id: Types.ObjectId;
  refundNumber: string;
  saleId: Types.ObjectId | string;
  tillSessionId: Types.ObjectId | string;
  cashierId: Types.ObjectId | string;
  totalAmount: number;
  createdAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    refundNumber: { type: String, required: true, unique: true, index: true },
    saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    tillSessionId: { type: Schema.Types.ObjectId, ref: "TillSession", required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalAmount: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Receipt Schema ---
export interface IReceipt {
  _id: Types.ObjectId;
  receiptNumber: string;
  type: "SALE" | "REFUND" | string;
  referenceId: string;
  createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ["SALE", "REFUND"] },
    referenceId: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Audit Log Schema ---
export interface IAuditLog {
  _id: Types.ObjectId;
  userId?: Types.ObjectId | string;
  userName?: string;
  role?: string;
  action: string;
  permission?: string;
  resource?: string;
  resourceId?: string;
  description: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    role: { type: String },
    action: { type: String, required: true },
    permission: { type: String },
    resource: { type: String },
    resourceId: { type: String },
    description: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Models Export ---
export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
export const Category: Model<ICategory> = models.Category || model<ICategory>("Category", CategorySchema);
export const Product: Model<IProduct> = models.Product || model<IProduct>("Product", ProductSchema);
export const Inventory: Model<IInventory> = models.Inventory || model<IInventory>("Inventory", InventorySchema);
export const StockMovement: Model<IStockMovement> = models.StockMovement || model<IStockMovement>("StockMovement", StockMovementSchema);
export const Purchase: Model<IPurchase> = models.Purchase || model<IPurchase>("Purchase", PurchaseSchema);
export const PurchaseItem: Model<IPurchaseItem> = models.PurchaseItem || model<IPurchaseItem>("PurchaseItem", PurchaseItemSchema);
export const TillSession: Model<ITillSession> = models.TillSession || model<ITillSession>("TillSession", TillSessionSchema);
export const Sale: Model<ISale> = models.Sale || model<ISale>("Sale", SaleSchema);
export const SaleItem: Model<ISaleItem> = models.SaleItem || model<ISaleItem>("SaleItem", SaleItemSchema);
export const Refund: Model<IRefund> = models.Refund || model<IRefund>("Refund", RefundSchema);
export const RefundItem: Model<IRefundItem> = models.RefundItem || model<IRefundItem>("RefundItem", RefundItemSchema);
export const Receipt: Model<IReceipt> = models.Receipt || model<IReceipt>("Receipt", ReceiptSchema);
export const AuditLog: Model<IAuditLog> = models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);

// Lowercase aliases for convenience and backwards-compatibility
export const users = User;
export const categories = Category;
export const products = Product;
export const inventory = Inventory;
export const stockMovements = StockMovement;
export const purchases = Purchase;
export const purchaseItems = PurchaseItem;
export const tillSessions = TillSession;
export const sales = Sale;
export const saleItems = SaleItem;
export const refunds = Refund;
export const refundItems = RefundItem;
export const receipts = Receipt;
export const auditLogs = AuditLog;
