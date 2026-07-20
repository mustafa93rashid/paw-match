const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");
const role = require("../middlewares/role");
const auth = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/upload.middleware");

const { requestEmailValidation, verifyEmailValidation } = require("../Validation/emailUpdate.validate");
const { emailUpdateLimiter } = require("../middlewares/limiter");

const {updateProfileValidation,updateUserRoleValidation, updateStatusValidation, createUserByAdminValidation} = require("../validation/userManagement.validate");

// Get current user profile
router.get("/profile", [auth], asyncHandler(userController.profile));

// Update current user profile
router.put("/profile", [auth, updateProfileValidation], asyncHandler(userController.updateProfile));

// Create a new user (Super Admin)
router.post("/create-user", [auth, role(["superadmin"]), createUserByAdminValidation], asyncHandler(userController.adminCreateUser));

// Get all users (Super Admin)
router.get("/", [auth, role(["superadmin"])], asyncHandler(userController.getAll));

// Update user role (Super Admin)
router.put("/:id/role", [auth, role(["superadmin"]), updateUserRoleValidation], asyncHandler(userController.updateRole));

// Activate / Deactivate user (Super Admin)
router.put("/:id/status", [auth, role(["superadmin"]), updateStatusValidation], asyncHandler(userController.updateStatus));

// Get user by ID (Super Admin)
router.get("/:id", [auth, role(["superadmin"])], asyncHandler(userController.getOne));

// Upload, replace, and delete profile image
router.patch("/profile/image",[auth, uploadSingle("image")],asyncHandler(userController.uploadProfileImage));

// Replace profile image
router.patch("/profile/image/replace",[auth, uploadSingle("image")],asyncHandler(userController.replaceProfileImage));

// Delete profile image
router.delete("/profile/image",[auth],asyncHandler(userController.deleteProfileImage));

// Email update routes
router.post("/request-email-update",[auth, emailUpdateLimiter, requestEmailValidation],asyncHandler(userController.requestEmailUpdate));
router.post("/verify-email-update",[auth, verifyEmailValidation],asyncHandler(userController.verifyEmailUpdate));

module.exports = router;