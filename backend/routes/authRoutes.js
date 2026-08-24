const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp, registerVendor, loginVendor } = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerVendor);
router.post("/login", loginVendor);

module.exports = router;
