const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const getJwtSecret = () => (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || "R9PV0hydrTHLEtl3yngua8VecGTmg15lIQr3NMlK5vJ";

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: "7d" });
};

const generateAdminToken = (id) => {
  return jwt.sign({ id, role: "superadmin" }, getJwtSecret(), { expiresIn: "7d" });
};

// 📧 1. Send Email OTP to Vendor Email (with Email & Phone uniqueness check)
const sendOtp = async (req, res) => {
  const { email, phone } = req.body;

  try {
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanPhone = (phone || "").replace(/\s+/g, "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address. ❌" });
    }

    // Check DB for existing active approved vendor by Email or Phone
    if (mongoose.connection.readyState === 1) {
      try {
        const existingEmail = await Vendor.findOne({ email: cleanEmail }).maxTimeMS(3000);
        if (existingEmail && existingEmail.isApproved) {
          return res.status(400).json({ success: false, message: "This email address is already registered to an active medical store. Please log in. ❌" });
        }

        if (cleanPhone) {
          const existingPhone = await Vendor.findOne({ phone: cleanPhone }).maxTimeMS(3000);
          if (existingPhone && existingPhone.isApproved) {
            return res.status(400).json({ success: false, message: "This contact phone number is already registered to another medical store. ❌" });
          }
        }
      } catch (dbErr) {
        console.warn("DB check notice in sendOtp:", dbErr.message);
      }
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save temporary OTP record on vendor if DB connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Vendor.findOneAndUpdate(
          { email: cleanEmail },
          { otp: hashedOtp, otpExpires: expiry, isVerified: false },
          { upsert: false }
        ).maxTimeMS(3000);
      } catch (dbErr) {
        console.warn("DB update notice in sendOtp:", dbErr.message);
      }
    }

    // Dispatch Email via Nodemailer asynchronously so HTTP response returns instantly to browser
    sendEmail(cleanEmail, "🔐 Your MediFind Store Verification OTP Code", otpCode).catch((err) => {
      console.warn("Background sendEmail notice:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: `Verification OTP code sent to ${cleanEmail}! 📧`,
      otpToken: jwt.sign(
        { email: cleanEmail, phone: cleanPhone, hashedOtp, expires: expiry.getTime() },
        getJwtSecret(),
        { expiresIn: "10m" }
      )
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    return res.status(500).json({ success: false, message: `Failed to send OTP: ${err.message}`, error: err.message });
  }
};

// 📧 2. Verify Email OTP Code (Stateless JWT token verification)
const verifyOtp = async (req, res) => {
  const { otp, otpToken } = req.body;

  try {
    if (!otp || !otpToken) {
      return res.status(400).json({ success: false, message: "Please enter the 6-digit verification code. ❌" });
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, getJwtSecret());
    } catch (e) {
      return res.status(400).json({ success: false, message: "OTP code has expired or is invalid. Please request a new OTP. ❌" });
    }

    if (Date.now() > decoded.expires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new OTP. ❌" });
    }

    const isMatch = await bcrypt.compare(otp.trim(), decoded.hashedOtp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect OTP code. Please check your email and try again. ❌" });
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully! ✅",
      verifiedEmail: decoded.email
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error verifying OTP", error: err.message });
  }
};

// 🏪 3. Register Vendor Store Account (Strict Email & Phone Uniqueness)
const registerVendor = async (req, res) => {
  const { name, email, password, storeName, phone, address, city, lat, lng, isVerified } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database connection error. Please whitelist 0.0.0.0/0 in MongoDB Atlas console or ensure MongoDB is running. ❌"
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = (phone || "").replace(/\s+/g, "").trim();

    // Check duplicate active store by email
    const existingEmail = await Vendor.findOne({ email: cleanEmail });
    if (existingEmail && existingEmail.isApproved) {
      return res.status(400).json({ message: "This email address is already registered to another active medical store ❌" });
    }

    // Check duplicate active store by phone number
    const existingPhone = await Vendor.findOne({ phone: cleanPhone });
    if (existingPhone && existingPhone._id.toString() !== (existingEmail?._id.toString() || "")) {
      return res.status(400).json({ message: "This contact phone number is already registered to another medical store ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let vendor;
    if (existingEmail) {
      existingEmail.name = name.trim();
      existingEmail.password = hashedPassword;
      existingEmail.storeName = storeName.trim();
      existingEmail.phone = cleanPhone;
      existingEmail.address = address.trim();
      existingEmail.city = city.trim();
      existingEmail.lat = parseFloat(lat) || 0;
      existingEmail.lng = parseFloat(lng) || 0;
      existingEmail.isVerified = Boolean(isVerified);
      existingEmail.isApproved = false;
      vendor = await existingEmail.save();
    } else {
      vendor = await Vendor.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        storeName: storeName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        city: city.trim(),
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        isVerified: Boolean(isVerified),
        isApproved: false, // Mandatory: Pending Super Admin approval
      });
    }

    res.status(201).json({
      message: "Store registration submitted! Verification completed ✅. Your application is pending Super Admin approval. ⏳",
      pendingApproval: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        storeName: vendor.storeName,
        email: vendor.email,
        phone: vendor.phone,
        isVerified: vendor.isVerified,
        isApproved: false,
      },
    });
  } catch (err) {
    console.error("Register Vendor Error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "Email / Phone";
      return res.status(400).json({ message: `Duplicate registration: This ${field} is already registered to another store ❌` });
    }
    if (err.name === "MongooseServerSelectionError" || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database connection error. Please whitelist 0.0.0.0/0 in Atlas. ❌" });
    }
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// 🔑 4. Login Vendor
const loginVendor = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database is not connected. Please whitelist 0.0.0.0/0 in MongoDB Atlas console. ❌" });
    }

    const cleanEmail = (email || "").toLowerCase().trim();

    // 1. Check Super Admin
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

    // 2. Check Vendor
    const vendor = await Vendor.findOne({ email: cleanEmail });
    if (!vendor) return res.status(400).json({ message: "Invalid email or password ❌" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password ❌" });

    if (vendor.isApproved === false) {
      return res.status(403).json({
        message: "Your Medical Store is currently pending approval from Super Admin. You cannot log in until Super Admin approves your store. ⚠️",
        isPendingApproval: true,
      });
    }

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
    res.status(500).json({ message: `Server error: ${err.message} ❌`, error: err.message });
  }
};

module.exports = { sendOtp, verifyOtp, registerVendor, loginVendor };
