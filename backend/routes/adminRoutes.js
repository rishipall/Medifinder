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
  getAllDoctors,
  toggleDoctorApproval,
  createDoctorByAdmin,
  updateDoctorByAdmin,
  deleteDoctorByAdmin,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/adminMiddleware");

// Public routes for Super Admin login & global theme management
router.post("/login", loginAdmin);
router.get("/theme", getGlobalTheme);
router.post("/theme", updateGlobalTheme);

// Medical Store Management Routes
router.get("/stores", protectAdmin, getAllStores);
router.post("/stores", protectAdmin, createStoreByAdmin);
router.put("/stores/:id/approve", protectAdmin, toggleStoreApproval);
router.put("/stores/:id", protectAdmin, updateStoreByAdmin);
router.delete("/stores/:id", protectAdmin, deleteStoreByAdmin);

// Doctor & Hospital Management Routes
router.get("/doctors", protectAdmin, getAllDoctors);
router.post("/doctors", protectAdmin, createDoctorByAdmin);
router.put("/doctors/:id/approve", protectAdmin, toggleDoctorApproval);
router.put("/doctors/:id", protectAdmin, updateDoctorByAdmin);
router.delete("/doctors/:id", protectAdmin, deleteDoctorByAdmin);

module.exports = router;
