const express = require("express");
const router = express.Router();
const { registerVendor, loginVendor } = require("../controllers/authController");

router.post("/register", registerVendor);
router.post("/login", loginVendor);

module.exports = router;
