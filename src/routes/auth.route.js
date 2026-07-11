const auth = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");  
const { signupLimiter, signinLimiter } = require("../middlewares/limiter");
const { signupValidation, signinValidation } = require("../Validation/auth.validate");

// Register new user
router.post("/signup", [signupLimiter, ...signupValidation], asyncHandler(authController.signup));

// Sign in
router.post("/signin", [signinLimiter, ...signinValidation], asyncHandler(authController.signin));

// Sign out
router.post("/logout", [auth], asyncHandler(authController.logout));

// Refresh access token
router.put("/refresh-token", asyncHandler(authController.refreshToken));

// Change password
router.put("/change-password", [auth], asyncHandler(authController.changePassword));

// Send password reset email
router.post("/forgot-password", asyncHandler(authController.forgotPassword));

// Reset password
router.post("/reset-password/:token", asyncHandler(authController.resetPassword));

module.exports = router;
