const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  getAllStores,
  toggleStoreApproval,
  createStoreByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,
  getGlobalTheme,
  updateGlobalTheme,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/adminMiddleware");

// Public route for Super Admin login & global theme fetching
router.post("/login", loginAdmin);
router.get("/theme", getGlobalTheme);

// Protected routes for Super Admin shop management & global theme update
router.post("/theme", protectAdmin, updateGlobalTheme);
router.get("/stores", protectAdmin, getAllStores);
router.post("/stores", protectAdmin, createStoreByAdmin);
router.put("/stores/:id/approve", protectAdmin, toggleStoreApproval);
router.put("/stores/:id", protectAdmin, updateStoreByAdmin);
router.delete("/stores/:id", protectAdmin, deleteStoreByAdmin);

module.exports = router;
