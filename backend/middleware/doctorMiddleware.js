const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");

const getJwtSecret = () => (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || "R9PV0hydrTHLEtl3yngua8VecGTmg15lIQr3NMlK5vJ";

const protectDoctor = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided, access denied ❌" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const doctor = await Doctor.findById(decoded.id).select("-password");
    if (!doctor) {
      return res.status(401).json({ message: "Doctor account not found ❌" });
    }

    if (doctor.isApproved === false) {
      return res.status(403).json({ message: "Account pending approval by Super Admin ⚠️" });
    }

    req.doctor = doctor;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired doctor token ❌" });
  }
};

module.exports = { protectDoctor };
