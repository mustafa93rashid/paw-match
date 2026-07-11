const express = require("express");
const router = express.Router();

const vetProfileController = require("../../controllers/vetProfile.controller",);

const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");

// Get current vet profile
router.get("/me", [auth, role(["vet"])], asyncHandler(vetProfileController.getMyProfile));

// Update current vet profile
router.put("/me", [auth, role(["vet"])], asyncHandler(vetProfileController.updateMyProfile));

// Get all vets
router.get("/", [auth], asyncHandler(vetProfileController.getAll));

// Get vet by profile ID
router.get("/:id", [auth], asyncHandler(vetProfileController.getOne));

module.exports = router;