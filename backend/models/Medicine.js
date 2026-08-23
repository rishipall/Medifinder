const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    companyName: { type: String, default: "Generic / Unspecified", trim: true },
    dosageMg: { type: String, default: "", trim: true }, // e.g. 500mg, 650mg, 10ml
    packSize: { type: String, default: "1 Unit", trim: true }, // e.g. 10 Tablets strip, 100ml bottle
    category: {
      type: String,
      enum: ["tablet", "syrup", "injection", "cream", "drops", "other"],
      default: "other",
    },
    price: { type: Number, required: true }, // Selling Price
    mrp: { type: Number, default: 0 }, // Max Retail Price
    stockQuantity: { type: Number, default: 10 }, // Stock units count
    inStock: { type: Boolean, default: true },
    composition: { type: String, default: "", trim: true }, // e.g. Paracetamol IP 650mg
    requiresPrescription: { type: Boolean, default: false }, // Rx required vs OTC
    expiryDate: { type: String, default: "", trim: true }, // e.g. 2026-12
    batchNumber: { type: String, default: "", trim: true },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ OPTIMIZATION: Index on name and vendorId for fast search queries
medicineSchema.index({ name: "text", companyName: "text", composition: "text" });
medicineSchema.index({ vendorId: 1 });

module.exports = mongoose.model("Medicine", medicineSchema);

