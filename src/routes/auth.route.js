const auth = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");  
const { signupLimiter, signinLimiter } = require("../middlewares/limiter");
const { signupValidation, signinValidation } = require("../Validation/auth.validate");


router.get("/profile", [auth], asyncHandler(authController.profile));

router.post("/signup", [signupLimiter, ...signupValidation], asyncHandler(authController.signup));

router.post("/signin", [signinLimiter, ...signinValidation], asyncHandler(authController.signin));

router.post("/logout", [auth], asyncHandler(authController.logout));

router.put("/refresh-token",  asyncHandler(authController.refreshToken));

module.exports = router;
