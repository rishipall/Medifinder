const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global_settings" },
    theme: { type: String, default: "classic" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
