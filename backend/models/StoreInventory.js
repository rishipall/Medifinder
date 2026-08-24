const mongoose = require("mongoose");

const storeInventorySchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterMedicine",
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    price: { type: Number, required: true }, // Store's selling price
    stockQuantity: { type: Number, default: 10 },
    inStock: { type: Boolean, default: true },
    expiryDate: { type: String, default: "", trim: true }, // e.g. 2026-12
    batchNumber: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// Prevent duplicate inventory entry for the same medicine by the same vendor
storeInventorySchema.index({ vendorId: 1, medicineId: 1 }, { unique: true });
storeInventorySchema.index({ medicineId: 1, inStock: 1 });

module.exports = mongoose.model("StoreInventory", storeInventorySchema);
