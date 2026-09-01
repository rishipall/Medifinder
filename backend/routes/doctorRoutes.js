const express = require("express");
const router = express.Router();
const {
  sendDoctorOtp,
  verifyDoctorOtp,
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getPublicDoctors,
} = require("../controllers/doctorController");
const { protectDoctor } = require("../middleware/doctorMiddleware");

router.post("/send-otp", sendDoctorOtp);
router.post("/verify-otp", verifyDoctorOtp);
router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.get("/profile", protectDoctor, getDoctorProfile);
router.put("/profile", protectDoctor, updateDoctorProfile);
router.get("/public", getPublicDoctors);

module.exports = router;
