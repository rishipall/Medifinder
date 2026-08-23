const express = require("express");
const router = express.Router();
const {
  searchMedicines,
  searchMultipleMedicines,
  extractMedicinesFromImages,
  getMedicinesByStore,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicineController");
const protect = require("../middleware/authMiddleware");

router.get("/search", searchMedicines);                  // public
router.get("/search-multiple", searchMultipleMedicines); // public GET
router.post("/search-multiple", searchMultipleMedicines);// public POST
router.post("/extract-from-images", extractMedicinesFromImages); // public Gemini OCR

router.get("/store/:vendorId", getMedicinesByStore); // public
router.post("/", protect, addMedicine);           // vendor only
router.put("/:id", protect, updateMedicine);      // vendor only
router.delete("/:id", protect, deleteMedicine);   // vendor only

module.exports = router;

