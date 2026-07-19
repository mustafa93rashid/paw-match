const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");
const role = require("../middlewares/role");
const auth = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/upload.middleware");

const {updateProfileValidation,updateUserRoleValidation, updateStatusValidation, createUserByAdminValidation} = require("../Validation/userManagement.validate");

// Get current user profile
router.get("/profile", [auth], asyncHandler(userController.profile));


// Create a new user (Super Admin)
router.post("/create-user", [auth, role(["superadmin"]), createUserByAdminValidation], asyncHandler(userController.adminCreateUser));
// //zain إنشاء مستخدم جديد وبروفايله الخاص بواسطة السوبر أدمن فقط
// router.post("/create-user", [auth, role(["superadmin"])],asyncHandler(userController.adminCreateUser));

// Get all users (Super Admin)
router.get("/", [auth, role(["superadmin"])], asyncHandler(userController.getAll));

// Update current user profile
router.put("/profile", [auth, updateProfileValidation], asyncHandler(userController.updateProfile));
// Update user role (Super Admin)
router.put("/:id/role", [auth, role(["superadmin"]), updateUserRoleValidation], asyncHandler(userController.updateRole));
// // Update user role (Super Admin)
// router.put("/:id/role", [auth, role(["superadmin"])], asyncHandler(userController.updateRole));

// Activate / Deactivate user (Super Admin)
router.put("/:id/status", [auth, role(["superadmin"]), updateStatusValidation], asyncHandler(userController.updateStatus));
// // Activate / Deactivate user (Super Admin)
// router.put("/:id/status", [auth, role(["superadmin"])], asyncHandler(userController.updateStatus));

// images routes
router.post(
  "/profile/image",
  [auth, uploadSingle("image")],
  asyncHandler(userController.uploadProfileImage),
);

router.patch(
  "/profile/image",
  [auth, uploadSingle("image")],
  asyncHandler(userController.replaceProfileImage),
);

router.delete(
  "/profile/image",
  [auth],
  asyncHandler(userController.deleteProfileImage),
);
// Get user by ID (Super Admin)
router.get("/:id", [auth, role(["superadmin"])], asyncHandler(userController.getOne));

module.exports = router;