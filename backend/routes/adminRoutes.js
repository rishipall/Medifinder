const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  getAllStores,
  toggleStoreApproval,
  createStoreByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/adminMiddleware");

// Public route for Super Admin login
router.post("/login", loginAdmin);

// Protected routes for Super Admin shop management
router.get("/stores", protectAdmin, getAllStores);
router.post("/stores", protectAdmin, createStoreByAdmin);
router.put("/stores/:id/approve", protectAdmin, toggleStoreApproval);
router.put("/stores/:id", protectAdmin, updateStoreByAdmin);
router.delete("/stores/:id", protectAdmin, deleteStoreByAdmin);

module.exports = router;
