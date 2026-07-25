const express = require("express");
const router = express.Router();

const shelterEmployeeProfileController = require("../../controllers/shelterEmployeeProfile.controller");
const auth = require("../../middlewares/auth");
const role = require("../../middlewares/role");
const asyncHandler = require("../../utils/asyncHandler");

const { updateEmployeeWorkDataValidation, getShelterEmployeeByUserIdValidation } = require("../../validation/shelterEmployeeProfile.validate");

// get authenticated shelter employee profile
router.get("/me", [auth, role(["shelterEmployee"])], asyncHandler(shelterEmployeeProfileController.getMyProfile));

// update shelter employee work data
router.put("/:userId/work-data", [auth, role(["superadmin"]), updateEmployeeWorkDataValidation], asyncHandler(shelterEmployeeProfileController.updateEmployeeWorkData));

// get all shelter employee profiles
router.get("/", [auth, role(["superadmin"])], asyncHandler(shelterEmployeeProfileController.getAll));

// search active, unassigned shelterEmployee accounts — superadmin or an
// active shelter Manager (any shelter); must be registered before /:userId
// so "available" isn't captured as a userId param
router.get("/available", [auth, role(["superadmin", "shelterEmployee"])], asyncHandler(shelterEmployeeProfileController.getAvailableEmployees));

// get shelter employee profile by User ID
router.get("/:userId", [auth, role(["superadmin"]), getShelterEmployeeByUserIdValidation], asyncHandler(shelterEmployeeProfileController.getOne));

module.exports = router;