const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, access denied ❌" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "R9PV0hydrTHLEtl3yngua8VecGTmg15lIQr3NMlK5vJ");

    // Check single active session against MongoDB
    const vendor = await Vendor.findById(decoded.id).select("sessionToken");
    if (!vendor || vendor.sessionToken !== token) {
      return res.status(401).json({
        message: "Session expired. Your account was logged in on another device ❌",
        singleSessionLogout: true
      });
    }

    req.vendor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token ❌" });
  }
};

module.exports = protect;
