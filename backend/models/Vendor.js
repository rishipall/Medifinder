const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    storeName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    gstNumber: { type: String, default: "", trim: true, uppercase: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    sessionToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Search & lookup indexes
vendorSchema.index({ phone: 1 });
vendorSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("Vendor", vendorSchema);
