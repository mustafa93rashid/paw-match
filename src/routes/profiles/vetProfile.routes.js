const express = require("express");
const router = express.Router();

const vetProfileController = require("../../controllers/vetProfile.controller");
const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");

const {updateMyProfileValidation, getAllValidation, getOneValidation,} = require("../../validation/vetProfile.validate");

// Get current vet profile
router.get("/me", [auth, role(["vet"])], asyncHandler(vetProfileController.getMyProfile));

// Update current vet profile
router.put("/me", [auth, role(["vet"]), updateMyProfileValidation], asyncHandler(vetProfileController.updateMyProfile));

// Get all vets
router.get("/", [auth, getAllValidation], asyncHandler(vetProfileController.getAll));

// Get vet by User ID
router.get("/:userId", [auth, getOneValidation], asyncHandler(vetProfileController.getOne));

module.exports = router;