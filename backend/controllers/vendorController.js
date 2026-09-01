const Vendor = require("../models/Vendor");
const bcrypt = require("bcryptjs");

// Get Vendor Profile by ID (Public store page)
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select("-password -sessionToken -otp -otpExpires");
    if (!vendor) return res.status(404).json({ message: "Store not found ❌" });
    res.status(200).json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Get Current Logged-In Vendor Profile
const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).select("-password -sessionToken -otp -otpExpires");
    if (!vendor) return res.status(404).json({ message: "Vendor profile not found ❌" });
    res.status(200).json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Update Current Logged-In Vendor Profile
const updateVendorProfile = async (req, res) => {
  try {
    const { name, storeName, phone, address, city, gstNumber, lat, lng, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (storeName) updateData.storeName = storeName.trim();
    if (phone) updateData.phone = phone.replace(/\D/g, "").trim();
    if (address) updateData.address = address.trim();
    if (city) updateData.city = city.trim();
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber.toUpperCase().replace(/\s+/g, "").trim();
    if (lat !== undefined) updateData.lat = parseFloat(lat) || 0;
    if (lng !== undefined) updateData.lng = parseFloat(lng) || 0;

    // Hash password if updating
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await Vendor.findByIdAndUpdate(
      req.vendor.id,
      updateData,
      { new: true }
    ).select("-password -sessionToken -otp -otpExpires");

    res.status(200).json({
      success: true,
      message: "Store profile updated successfully ✅",
      vendor: updated
    });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

module.exports = { getVendorById, getVendorProfile, updateVendorProfile };
