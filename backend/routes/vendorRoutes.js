const express = require("express");
const router = express.Router();
const { getVendorById, getVendorProfile, updateVendorProfile } = require("../controllers/vendorController");
const protect = require("../middleware/authMiddleware");

router.get("/profile", protect, getVendorProfile);
router.put("/profile", protect, updateVendorProfile);
router.get("/:id", getVendorById);

module.exports = router;
