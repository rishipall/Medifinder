const express = require("express");
const router = express.Router();
const { getVendorById, updateVendorProfile } = require("../controllers/vendorController");
const protect = require("../middleware/authMiddleware");

router.get("/:id", getVendorById);
router.put("/profile", protect, updateVendorProfile);

module.exports = router;
