const auth = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");  
const { signupLimiter, signinLimiter } = require("../middlewares/limiter");
const { signupValidation, signinValidation } = require("../Validation/auth.validate");




router.put("/change-password", [auth], asyncHandler(authController.changePassword));

router.post("/forgot-password", asyncHandler(authController.forgotPassword));

router.post("/reset-password/:token", asyncHandler(authController.resetPassword));

router.post("/signup", [signupLimiter, ...signupValidation], asyncHandler(authController.signup));

router.post("/signin", [signinLimiter, ...signinValidation], asyncHandler(authController.signin));

router.post("/logout", [auth], asyncHandler(authController.logout));

router.put("/refresh-token",  asyncHandler(authController.refreshToken));

module.exports = router;
