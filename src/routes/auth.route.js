const auth = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");  
const { signupLimiter, signinLimiter, verifySignupLimiter } = require("../middlewares/limiter");
const { signupValidation, signinValidation, verifySignupValidation, changePasswordValidation, forgotPasswordValidation, resetPasswordValidation } = require("../validation/auth.validate");
const validate = require("../middlewares/validate");

// Register new user
router.post("/signup", [signupLimiter, ...signupValidation], asyncHandler(authController.signup));

// Verify signup
router.post("/verify-signup", [verifySignupLimiter,...verifySignupValidation], asyncHandler(authController.verifySignup));

// Sign in
router.post("/signin", [signinLimiter, ...signinValidation], asyncHandler(authController.signin));

// Sign out
router.post("/logout", [auth], asyncHandler(authController.logout));

// Refresh access token
router.put("/refresh-token", asyncHandler(authController.refreshToken));

// Change password
router.put("/change-password", [auth, ...changePasswordValidation], asyncHandler(authController.changePassword));

// Send password reset email
router.post("/forgot-password", [...forgotPasswordValidation], asyncHandler(authController.forgotPassword));

// Reset password
router.post("/reset-password/:token", [...resetPasswordValidation], asyncHandler(authController.resetPassword));

module.exports = router;