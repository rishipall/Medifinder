const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const getJwtSecret = () => (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || "R9PV0hydrTHLEtl3yngua8VecGTmg15lIQr3NMlK5vJ";

const generateToken = (id) => {
  return jwt.sign({ id, role: "doctor" }, getJwtSecret(), { expiresIn: "7d" });
};

// 📧 1. Send Email OTP to Doctor Email
const sendDoctorOtp = async (req, res) => {
  const { email, phone } = req.body;

  try {
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanPhone = (phone || "").replace(/\s+/g, "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address. ❌" });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const existingEmail = await Doctor.findOne({ email: cleanEmail }).maxTimeMS(3000);
        if (existingEmail && existingEmail.isApproved) {
          return res.status(400).json({ success: false, message: "This email address is already registered to an active doctor. Please log in. ❌" });
        }

        if (cleanPhone) {
          const existingPhone = await Doctor.findOne({ phone: cleanPhone }).maxTimeMS(3000);
          if (existingPhone && existingPhone.isApproved) {
            return res.status(400).json({ success: false, message: "This contact phone number is already registered to another doctor profile. ❌" });
          }
        }
      } catch (dbErr) {
        console.warn("DB check notice in sendDoctorOtp:", dbErr.message);
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      try {
        await Doctor.findOneAndUpdate(
          { email: cleanEmail },
          { otp: hashedOtp, otpExpires: expiry, isVerified: false },
          { upsert: false }
        ).maxTimeMS(3000);
      } catch (dbErr) {
        console.warn("DB update notice in sendDoctorOtp:", dbErr.message);
      }
    }

    try {
      await sendEmail(cleanEmail, "🔐 Your MediFind Doctor Verification OTP Code", otpCode);
    } catch (mailErr) {
      console.warn("sendEmail delivery warning for doctor:", mailErr.message);
    }

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
    console.error("Send Doctor OTP Error:", err);
    return res.status(500).json({ success: false, message: `Failed to send OTP: ${err.message}`, error: err.message });
  }
};

// 📧 2. Verify Doctor OTP Code
const verifyDoctorOtp = async (req, res) => {
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
    console.error("Verify Doctor OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error verifying OTP", error: err.message });
  }
};

// 🩺 3. Register Doctor / Hospital Profile
const registerDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    whatsapp,
    hospitalName,
    category,
    specialization,
    degree,
    isGeneralPhysician,
    address,
    city,
    lat,
    lng,
    gstNumber,
    clinicDetails,
    educationDetails,
    isVerified,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database connection error. Please ensure MongoDB is connected. ❌"
      });
    }

    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanPhone = (phone || "").replace(/\D/g, "").trim();
    const cleanWhatsapp = (whatsapp || phone || "").replace(/\D/g, "").trim();
    const cleanGst = (gstNumber || "").toUpperCase().replace(/\s+/g, "").trim();

    if (!name || !hospitalName || !degree || !address || !city) {
      return res.status(400).json({ message: "Please fill in all required fields (Name, Hospital/Clinic Name, Degree, Address, City). ❌" });
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ message: "Please enter a valid numeric contact phone number (min 10 digits). ❌" });
    }

    // Process specialization array
    let specArray = [];
    if (Array.isArray(specialization)) {
      specArray = specialization;
    } else if (typeof specialization === "string") {
      specArray = specialization.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (specArray.length === 0) {
      specArray = ["General Physician"];
    }

    const existingEmail = await Doctor.findOne({ email: cleanEmail });
    if (existingEmail && existingEmail.isApproved) {
      return res.status(400).json({ message: "This email address is already registered to an active doctor profile ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let doctor;
    if (existingEmail) {
      existingEmail.name = name.trim();
      existingEmail.password = hashedPassword;
      existingEmail.phone = cleanPhone;
      existingEmail.whatsapp = cleanWhatsapp;
      existingEmail.hospitalName = hospitalName.trim();
      existingEmail.category = category || "Clinic";
      existingEmail.specialization = specArray;
      existingEmail.degree = degree.trim();
      existingEmail.isGeneralPhysician = Boolean(isGeneralPhysician);
      existingEmail.address = address.trim();
      existingEmail.city = city.trim();
      existingEmail.lat = parseFloat(lat) || 0;
      existingEmail.lng = parseFloat(lng) || 0;
      existingEmail.gstNumber = cleanGst;
      existingEmail.clinicDetails = (clinicDetails || "").trim();
      existingEmail.educationDetails = (educationDetails || "").trim();
      existingEmail.isVerified = Boolean(isVerified);
      existingEmail.isApproved = false; // Pending Super Admin approval
      doctor = await existingEmail.save();
    } else {
      doctor = await Doctor.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: cleanPhone,
        whatsapp: cleanWhatsapp,
        hospitalName: hospitalName.trim(),
        category: category || "Clinic",
        specialization: specArray,
        degree: degree.trim(),
        isGeneralPhysician: Boolean(isGeneralPhysician),
        address: address.trim(),
        city: city.trim(),
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        gstNumber: cleanGst,
        clinicDetails: (clinicDetails || "").trim(),
        educationDetails: (educationDetails || "").trim(),
        isVerified: Boolean(isVerified),
        isApproved: false, // Mandatory: Pending Super Admin approval
      });
    }

    res.status(201).json({
      message: "Doctor registration submitted successfully! Verification completed ✅. Your application is pending Super Admin approval. ⏳",
      pendingApproval: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        hospitalName: doctor.hospitalName,
        category: doctor.category,
        specialization: doctor.specialization,
        degree: doctor.degree,
        email: doctor.email,
        phone: doctor.phone,
        whatsapp: doctor.whatsapp,
        isVerified: doctor.isVerified,
        isApproved: false,
      },
    });
  } catch (err) {
    console.error("Register Doctor Error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate registration: Email or Phone already exists ❌" });
    }
    res.status(500).json({ message: "Server error ❌", error: err.message });
  }
};

// 🔑 4. Doctor Login
const loginDoctor = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database is not connected. ❌" });
    }

    const cleanEmail = (email || "").toLowerCase().trim();

    const doctor = await Doctor.findOne({ email: cleanEmail });
    if (!doctor) return res.status(400).json({ message: "Invalid email or password ❌" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password ❌" });

    if (doctor.isApproved === false) {
      return res.status(403).json({
        message: "Your Doctor / Hospital account is currently pending approval from Super Admin. You cannot log in until Super Admin approves your account. ⚠️",
        isPendingApproval: true,
      });
    }

    const token = generateToken(doctor._id);
    doctor.sessionToken = token;
    await doctor.save();

    res.status(200).json({
      message: "Doctor login successful ✅",
      role: "doctor",
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        hospitalName: doctor.hospitalName,
        category: doctor.category,
        specialization: doctor.specialization,
        degree: doctor.degree,
        isGeneralPhysician: doctor.isGeneralPhysician,
        email: doctor.email,
        phone: doctor.phone,
        whatsapp: doctor.whatsapp,
        address: doctor.address,
        city: doctor.city,
        lat: doctor.lat,
        lng: doctor.lng,
        gstNumber: doctor.gstNumber,
        clinicDetails: doctor.clinicDetails,
        educationDetails: doctor.educationDetails,
        isApproved: true,
      },
    });
  } catch (err) {
    console.error("Doctor Login Error:", err);
    res.status(500).json({ message: `Server error: ${err.message} ❌`, error: err.message });
  }
};

// 👤 5. Get Logged In Doctor Profile
const getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.doctor ? req.doctor._id : req.params.id;
    const doctor = await Doctor.findById(doctorId).select("-password");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found ❌" });
    }
    res.status(200).json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✏️ 6. Update Doctor Profile (Self)
const updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.doctor ? req.doctor._id : req.params.id;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found ❌" });
    }

    const {
      name,
      phone,
      whatsapp,
      hospitalName,
      category,
      specialization,
      degree,
      isGeneralPhysician,
      address,
      city,
      lat,
      lng,
      gstNumber,
      clinicDetails,
      educationDetails,
      password,
    } = req.body;

    if (name) doctor.name = name.trim();
    if (phone) doctor.phone = phone.trim();
    if (whatsapp !== undefined) doctor.whatsapp = whatsapp.trim();
    if (hospitalName) doctor.hospitalName = hospitalName.trim();
    if (category) doctor.category = category;
    if (degree) doctor.degree = degree.trim();
    if (isGeneralPhysician !== undefined) doctor.isGeneralPhysician = Boolean(isGeneralPhysician);
    if (address) doctor.address = address.trim();
    if (city) doctor.city = city.trim();
    if (lat !== undefined) doctor.lat = parseFloat(lat) || 0;
    if (lng !== undefined) doctor.lng = parseFloat(lng) || 0;
    if (gstNumber !== undefined) doctor.gstNumber = gstNumber.trim().toUpperCase();
    if (clinicDetails !== undefined) doctor.clinicDetails = clinicDetails.trim();
    if (educationDetails !== undefined) doctor.educationDetails = educationDetails.trim();

    if (specialization) {
      let specArray = [];
      if (Array.isArray(specialization)) specArray = specialization;
      else if (typeof specialization === "string") specArray = specialization.split(",").map(s => s.trim()).filter(Boolean);
      if (specArray.length > 0) doctor.specialization = specArray;
    }

    if (password && password.trim().length > 0) {
      doctor.password = await bcrypt.hash(password.trim(), 10);
    }

    await doctor.save();

    res.status(200).json({
      message: "Doctor profile updated successfully ✅",
      doctor,
    });
  } catch (err) {
    console.error("Update Doctor Profile Error:", err);
    res.status(500).json({ message: "Server error updating doctor profile", error: err.message });
  }
};

// 🔍 7. Public Lookup for Approved Doctors / Hospitals
const getPublicDoctors = async (req, res) => {
  try {
    const { specialization, category, city, search } = req.query;

    const query = { isApproved: true };

    if (specialization) {
      query.specialization = { $regex: new RegExp(specialization, "i") };
    }

    if (category) {
      query.category = category;
    }

    if (city) {
      query.city = { $regex: new RegExp(city, "i") };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { hospitalName: searchRegex },
        { specialization: searchRegex },
        { degree: searchRegex },
        { city: searchRegex },
      ];
    }

    const doctors = await Doctor.find(query).select("-password -otp -otpExpires -sessionToken").sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    console.error("Get Public Doctors Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  sendDoctorOtp,
  verifyDoctorOtp,
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getPublicDoctors,
};
