const Admin = require("../models/Admin");
const Vendor = require("../models/Vendor");
const Medicine = require("../models/Medicine");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateAdminToken = (id) => {
  return jwt.sign({ id, role: "superadmin" }, process.env.JWT_SECRET || "medifind_super_secret_key", { expiresIn: "7d" });
};

// Super Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(400).json({ message: "Invalid Super Admin credentials ❌" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Super Admin credentials ❌" });
    }

    const token = generateAdminToken(admin._id);

    res.status(200).json({
      message: "Super Admin Login Successful ✅",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Get All Medical Stores & Admin Dashboard Stats
const getAllStores = async (req, res) => {
  try {
    const stores = await Vendor.find().select("-password").sort({ createdAt: -1 }).lean();

    // Attach medicine count to each store
    const storeIds = stores.map((s) => s._id);
    const medicineCounts = await Medicine.aggregate([
      { $match: { vendorId: { $in: storeIds } } },
      { $group: { _id: "$vendorId", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    medicineCounts.forEach((m) => {
      countMap[m._id.toString()] = m.count;
    });

    const enrichedStores = stores.map((s) => ({
      ...s,
      isApproved: s.isApproved !== undefined ? s.isApproved : true, // default true for pre-existing stores
      medicineCount: countMap[s._id.toString()] || 0,
    }));

    const totalStores = enrichedStores.length;
    const pendingStores = enrichedStores.filter((s) => !s.isApproved).length;
    const approvedStores = enrichedStores.filter((s) => s.isApproved).length;

    res.status(200).json({
      stats: {
        totalStores,
        pendingStores,
        approvedStores,
      },
      stores: enrichedStores,
    });
  } catch (err) {
    console.error("Get All Stores Error:", err);
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Approve or Revoke Approval for a Medical Store
const toggleStoreApproval = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const store = await Vendor.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Medical Store not found ❌" });
    }

    store.isApproved = isApproved !== undefined ? Boolean(isApproved) : !store.isApproved;
    await store.save();

    res.status(200).json({
      message: `Store ${store.storeName} is now ${store.isApproved ? "Approved ✅" : "Pending/Suspended ⚠️"}`,
      store: {
        id: store._id,
        storeName: store.storeName,
        isApproved: store.isApproved,
      },
    });
  } catch (err) {
    console.error("Toggle Store Approval Error:", err);
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Super Admin Creates a New Medical Store Directly
const createStoreByAdmin = async (req, res) => {
  const { name, email, password, storeName, phone, address, city, lat, lng, isApproved } = req.body;
  try {
    const existing = await Vendor.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered for another store ❌" });
    }

    const hashedPassword = await bcrypt.hash(password || "Pharmacy#Store2026", 10);

    const newStore = await Vendor.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      storeName: storeName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      isApproved: isApproved !== undefined ? Boolean(isApproved) : true,
    });

    res.status(201).json({
      message: "Medical Store created successfully by Super Admin ✅",
      store: newStore,
    });
  } catch (err) {
    console.error("Create Store By Admin Error:", err);
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Super Admin Updates a Medical Store Details
const updateStoreByAdmin = async (req, res) => {
  try {
    const store = await Vendor.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Medical Store not found ❌" });
    }

    const { name, email, storeName, phone, address, city, lat, lng, isApproved, password } = req.body;

    if (name) store.name = name.trim();
    if (email) store.email = email.toLowerCase().trim();
    if (storeName) store.storeName = storeName.trim();
    if (phone) store.phone = phone.trim();
    if (address) store.address = address.trim();
    if (city) store.city = city.trim();
    if (lat !== undefined) store.lat = parseFloat(lat) || 0;
    if (lng !== undefined) store.lng = parseFloat(lng) || 0;
    if (isApproved !== undefined) store.isApproved = Boolean(isApproved);
    if (password && password.trim().length > 0) {
      store.password = await bcrypt.hash(password.trim(), 10);
    }

    await store.save();

    res.status(200).json({
      message: `Medical Store ${store.storeName} updated successfully ✅`,
      store,
    });
  } catch (err) {
    console.error("Update Store By Admin Error:", err);
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// Super Admin Deletes a Medical Store (and removes its medicines)
const deleteStoreByAdmin = async (req, res) => {
  try {
    const store = await Vendor.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Medical Store not found ❌" });
    }

    // Delete all medicines belonging to this store
    await Medicine.deleteMany({ vendorId: store._id });

    // Delete the store itself
    await Vendor.findByIdAndDelete(store._id);

    res.status(200).json({
      message: `Medical Store ${store.storeName} and its inventory deleted successfully ✅`,
    });
  } catch (err) {
    console.error("Delete Store By Admin Error:", err);
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

module.exports = {
  loginAdmin,
  getAllStores,
  toggleStoreApproval,
  createStoreByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,
};
