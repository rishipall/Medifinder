const Vendor = require("../models/Vendor");

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select("-password");
    if (!vendor) return res.status(404).json({ message: "Store not found ❌" });
    res.status(200).json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

const updateVendorProfile = async (req, res) => {
  try {
    const updated = await Vendor.findByIdAndUpdate(
      req.vendor.id,
      { ...req.body },
      { new: true }
    ).select("-password");
    res.status(200).json({ message: "Profile updated ✅", vendor: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

module.exports = { getVendorById, updateVendorProfile };
