const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const JWT_SECRET_KEY = (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || "R9PV0hydrTHLEtl3yngua8VecGTmg15lIQr3NMlK5vJ";

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET_KEY, { expiresIn: "7d" });
};

const generateAdminToken = (id) => {
  return jwt.sign({ id, role: "superadmin" }, JWT_SECRET_KEY, { expiresIn: "7d" });
};

const registerVendor = async (req, res) => {
  const { name, email, password, storeName, phone, address, city, lat, lng } = req.body;
  try {
    const existing = await Vendor.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: "Email already registered ❌" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = await Vendor.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      storeName: storeName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      isApproved: false, // Mandatory: New vendors default to pending approval!
    });

    res.status(201).json({
      message: "Store registration submitted! Your application is pending Super Admin approval. Please wait for Super Admin to approve your shop before logging in. ⏳",
      pendingApproval: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        storeName: vendor.storeName,
        email: vendor.email,
        isApproved: false,
      },
    });
  } catch (err) {
    console.error("Register Vendor Error:", err);
    if (err.name === "MongooseServerSelectionError" || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database connection error. Please whitelist your IP in MongoDB Atlas console (0.0.0.0/0). ❌" });
    }
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

const loginVendor = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database is not connected. Please whitelist your IP in MongoDB Atlas console (0.0.0.0/0). ❌" });
    }

    const cleanEmail = (email || "").toLowerCase().trim();

    // 1. First check if credentials match a Super Admin account!
    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin) {
      const isAdminMatch = await bcrypt.compare(password, admin.password);
      if (isAdminMatch) {
        const adminToken = generateAdminToken(admin._id);
        return res.status(200).json({
          message: "Super Admin Login Successful ✅",
          role: "superadmin",
          token: adminToken,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: "superadmin",
          },
        });
      }
    }

    // 2. Otherwise check Vendor store accounts
    const vendor = await Vendor.findOne({ email: cleanEmail });
    if (!vendor) return res.status(400).json({ message: "Invalid email or password ❌" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password ❌" });

    // 🛑 STRICT SUPER ADMIN APPROVAL GATE: No Medical Store can log in before Super Admin Approval!
    if (vendor.isApproved === false) {
      return res.status(403).json({
        message: "Your Medical Store is currently pending approval from Super Admin. You cannot log in until Super Admin approves your store. ⚠️",
        isPendingApproval: true,
      });
    }

    // Single Active Session: Generate new token and invalidate previous session
    const token = generateToken(vendor._id);
    vendor.sessionToken = token;
    await vendor.save();

    res.status(200).json({
      message: "Login successful ✅",
      role: "vendor",
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        storeName: vendor.storeName,
        email: vendor.email,
        isApproved: true,
      },
    });
  } catch (err) {
    console.error("Login Error Details:", err.stack || err);
    if (err.name === "MongooseServerSelectionError" || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database connection error. Please whitelist 0.0.0.0/0 in MongoDB Atlas console. ❌" });
    }
    res.status(500).json({ message: `Server error: ${err.message} ❌`, error: err.message });
  }
};


module.exports = { registerVendor, loginVendor };

