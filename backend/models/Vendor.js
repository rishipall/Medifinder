const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    storeName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    sessionToken: { type: String, default: null },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Vendor", vendorSchema);
