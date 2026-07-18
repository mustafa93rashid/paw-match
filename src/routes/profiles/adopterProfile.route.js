const router = require("express").Router();

const adopterProfileController = require("../../controllers/adopterProfile.controller");
const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");

const { updateAdopterProfileValidation, getAdopterByUserIdValidation } = require("../../validation/adopterProfile");

// get authenticated adopter profile
router.get("/me", [auth, role(["adopter"])], asyncHandler(adopterProfileController.getMyProfile));

// Update authenticated adopter profile
router.put("/me", [auth, role(["adopter"]), updateAdopterProfileValidation], asyncHandler(adopterProfileController.updateMyProfile));

// Get all adopter profiles (accessible only to superadmin)
router.get("/", [auth, role(["superadmin"])], asyncHandler(adopterProfileController.getAllAdopters));

// Get adopter profile by user ID (accessible to superadmin and shelterEmployee)
router.get("/:userId", [auth, role(["superadmin", "shelterEmployee"]), getAdopterByUserIdValidation], asyncHandler(adopterProfileController.getAdopterByUserId));

module.exports = router;