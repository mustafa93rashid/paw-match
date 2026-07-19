const router = require("express").Router();

const shelterController = require("../controllers/shelter.controller");
const shelterValidation = require("../validation/shelter.validate");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const { uploadSingle, uploadArray } = require("../middlewares/upload.middleware");
// Get nearest shelters
// Modified by Batoul - Reason: Task 5 - Added route for nearest shelters
// ملاحظة: تم وضع الراوت هنا في الأعلى قبل الـ ID لتجنب أي تعارض
router.get("/nearest", shelterValidation.getNearestSheltersValidation,asyncHandler(shelterController.getNearestShelters));

// Create a new shelter
router.post("/", [auth, role(["superadmin", "shelterEmployee"])], shelterValidation.createShelterValidation, asyncHandler(shelterController.createShelter));

// Get all approved public shelters
router.get("/", shelterValidation.getPublicSheltersValidation, asyncHandler(shelterController.getPublicShelters));

// Get all shelters (Super Admin)
router.get("/admin/all", [auth, role(["superadmin"])], shelterValidation.getAllSheltersValidation, asyncHandler(shelterController.getAllShelters));

// Get shelter by ID
router.get("/:id", [auth], shelterValidation.getShelterByIdValidation, asyncHandler(shelterController.getShelterById));

// Update shelter
router.patch("/:id", [auth, role(["superadmin", "shelterEmployee"])], shelterValidation.updateShelterValidation, asyncHandler(shelterController.updateShelter));

// Approve shelter
router.patch("/:id/approve", [auth, role(["superadmin"])], shelterValidation.approveShelterValidation, asyncHandler(shelterController.approveShelter));

// Reject shelter
router.patch("/:id/reject", [auth, role(["superadmin"])], shelterValidation.rejectShelterValidation, asyncHandler(shelterController.rejectShelter));

// Deactivate shelter & Activate shelter
router.patch("/:id/status", [auth, role(["superadmin"])], shelterValidation.toggleShelterStatusValidation, asyncHandler(shelterController.toggleShelterStatus));

// Permanently delete shelter
router.delete("/:id/permanent", [auth, role(["superadmin"])], shelterValidation.permanentlyDeleteShelterValidation, asyncHandler(shelterController.permanentlyDeleteShelter));

// Add employee to shelter
router.patch("/:id/employees", [auth, role(["superadmin", "shelterEmployee"])], shelterValidation.addEmployeeValidation, asyncHandler(shelterController.addEmployee));

// Remove employee from shelter

router.delete(
  "/:id/employees/:employeeId",
  [
    auth,
    role(["superadmin", "shelterEmployee"]),
    shelterValidation.removeEmployeeValidation,
  ],
   
  asyncHandler(shelterController.removeEmployee)
);

router.patch(
  "/:id/logo",
  [auth, role(["superadmin", "shelterEmployee"]), uploadSingle("image")],
  asyncHandler(shelterController.uploadLogo)
);
router.patch(
  "/:id/logo/replace",
  [auth, role(["superadmin", "shelterEmployee"]), uploadSingle("image")],
  asyncHandler(shelterController.replaceLogo),
);

router.delete(
  "/:id/logo",
  [auth, role(["superadmin", "shelterEmployee"])],
  asyncHandler(shelterController.deleteLogo),
);

router.post(
  "/:id/images",
  [auth, role(["superadmin", "shelterEmployee"]), uploadArray("images", 10)],
  asyncHandler(shelterController.addShelterImages),
);

router.delete(
  "/:id/images/:publicId",
  [auth, role(["superadmin", "shelterEmployee"])],
  asyncHandler(shelterController.deleteShelterImage),
);
module.exports = router;