const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");
const role = require("../middlewares/role");
const auth = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/upload.middleware");

// Get current user profile
router.get("/profile", [auth], asyncHandler(userController.profile));

// Update current user profile
router.put("/profile", [auth], asyncHandler(userController.updateProfile));

// Get all users (Super Admin)
router.get("/", [auth, role(["superadmin"])], asyncHandler(userController.getAll));

// Get user by ID (Super Admin)
router.get("/:id", [auth, role(["superadmin"])], asyncHandler(userController.getOne));

// Update user role (Super Admin)
router.put("/:id/role", [auth, role(["superadmin"])], asyncHandler(userController.updateRole));

// Activate / Deactivate user (Super Admin)
router.put("/:id/status", [auth, role(["superadmin"])], asyncHandler(userController.updateStatus));

//zain إنشاء مستخدم جديد وبروفايله الخاص بواسطة السوبر أدمن فقط
router.post("/create-user", [auth, role(["superadmin"])],asyncHandler(userController.adminCreateUser));

router.patch(
  "/profile/image",
  [auth, uploadSingle("image")],
  asyncHandler(userController.uploadProfileImage),
);

router.patch(
  "/profile/image/replace",
  [auth, uploadSingle("image")],
  asyncHandler(userController.replaceProfileImage),
);

router.delete(
  "/profile/image",
  [auth],
  asyncHandler(userController.deleteProfileImage),
);
module.exports = router;