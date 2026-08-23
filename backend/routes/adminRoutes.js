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

// Public routes for Super Admin login & global theme management
router.post("/login", loginAdmin);
router.get("/theme", getGlobalTheme);
router.post("/theme", updateGlobalTheme);
router.get("/stores", protectAdmin, getAllStores);
router.post("/stores", protectAdmin, createStoreByAdmin);
router.put("/stores/:id/approve", protectAdmin, toggleStoreApproval);
router.put("/stores/:id", protectAdmin, updateStoreByAdmin);
router.delete("/stores/:id", protectAdmin, deleteStoreByAdmin);

module.exports = router;
