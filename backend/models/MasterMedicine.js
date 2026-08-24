const mongoose = require("mongoose");

const masterMedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, index: true },
    brandName: { type: String, default: "", trim: true },
    companyName: { type: String, default: "Generic / Unspecified", trim: true },
    dosageMg: { type: String, default: "", trim: true }, // e.g. 500mg, 650mg, 10ml
    packSize: { type: String, default: "1 Unit", trim: true }, // e.g. 10 Tablets strip, 100ml bottle
    category: {
      type: String,
      enum: ["tablet", "syrup", "injection", "cream", "drops", "other"],
      default: "other",
    },
    composition: { type: String, default: "", trim: true }, // e.g. Paracetamol IP 650mg
    mrp: { type: Number, default: 0 }, // Max Retail Price
    requiresPrescription: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Search indexes
masterMedicineSchema.index({ name: "text", brandName: "text", composition: "text" });

module.exports = mongoose.model("MasterMedicine", masterMedicineSchema);
