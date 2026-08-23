const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Super Admin" },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: "superadmin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
