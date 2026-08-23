const express = require("express");
const router = express.Router();
const { analyzeSymptoms } = require("../controllers/consultController");

router.post("/analyze", analyzeSymptoms);

module.exports = router;
