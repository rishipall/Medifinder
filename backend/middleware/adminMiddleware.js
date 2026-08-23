const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "medifind_super_secret_key");

      if (decoded.role === "superadmin") {
        const admin = await Admin.findById(decoded.id).select("-password");
        if (admin) {
          req.admin = admin;
          return next();
        }
      }
      return res.status(401).json({ message: "Not authorized as Super Admin ❌" });
    } catch (err) {
      console.error("Admin Auth Middleware Error:", err.message);
      return res.status(401).json({ message: "Token invalid or expired ❌" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided, Super Admin authorization required ❌" });
  }
};

module.exports = { protectAdmin };
