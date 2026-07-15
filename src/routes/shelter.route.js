const router = require("express").Router();

const shelterController = require("../controllers/shelter.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

// Modified by Batoul - Reason: Task 5 - Added route for nearest shelters
// ملاحظة: تم وضع الراوت هنا في الأعلى قبل الـ ID لتجنب أي تعارض
router.get("/nearest", asyncHandler(shelterController.getNearestShelters));

// Create a new shelter
router.post("/", [auth, role(["superadmin", "shelterEmployee"])], asyncHandler(shelterController.createShelter));

// Get all approved public shelters
router.get("/", asyncHandler(shelterController.getPublicShelters));

// Get all shelters (Super Admin)
router.get("/admin/all", [auth, role(["superadmin"])], asyncHandler(shelterController.getAllShelters));

// Get shelter by ID
router.get("/:id", [auth], asyncHandler(shelterController.getShelterById));

// Update shelter
router.patch("/:id", [auth, role(["superadmin", "shelterEmployee"])], asyncHandler(shelterController.updateShelter));

// Approve shelter
router.patch("/:id/approve", [auth, role(["superadmin"])], asyncHandler(shelterController.approveShelter));

// Reject shelter
router.patch("/:id/reject", [auth, role(["superadmin"])], asyncHandler(shelterController.rejectShelter));

// Deactivate shelter & Activate shelter
router.patch("/:id/status", [auth, role(["superadmin"])], asyncHandler(shelterController.toggleShelterStatus));

// Permanently delete shelter
router.delete("/:id/permanent", [auth, role(["superadmin"])], asyncHandler(shelterController.permanentlyDeleteShelter));

// Add employee to shelter
router.patch("/:id/employees", [auth, role(["superadmin", "shelterEmployee"])], asyncHandler(shelterController.addEmployee));

// Remove employee from shelter
router.delete("/:id/employees/:employeeId", [auth, role(["superadmin", "shelterEmployee"])], asyncHandler(shelterController.removeEmployee));

module.exports = router;